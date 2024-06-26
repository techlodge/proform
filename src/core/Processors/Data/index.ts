import {
  ProcessValueOrFunctionOptions,
  RawSchema,
  StableEachKeyOptions,
} from "@/core/Processors/Data/types";
import RenderRuntime from "@/core/Runtimes/Render";
import { StabledSchema } from "@/core/Runtimes/Render/types";
import {
  cloneDeep,
  get,
  isEqual,
  isFunction,
  isPlainObject,
  set,
} from "lodash";
import { v4 } from "uuid";
import { Ref, ref, watch } from "vue";

export default class DataProcessor {
  stableSchemas: Ref<StabledSchema[]>; // stableSchmeas from RenderRuntime
  model: Ref<AnyObject>;
  effects: Record<string, Set<AnyFunction>> = {};
  schemaIdkey = Symbol.for("schemaIdkey");
  keysWithEffectsByTargetWithEffects = new Map();
  afterModelUpdateEffects = new Map<AnyObject, Set<AnyFunction>>();
  modelProcessProgress = new Map();
  prevModelState;
  nonDeepProcessableKeys = ["component"];

  constructor(public renderRuntime: RenderRuntime) {
    this.stableSchemas = renderRuntime.stableSchemas;
    this.model = renderRuntime.model;
    this.prevModelState = ref(cloneDeep(renderRuntime.model.value));
  }

  processSchemas(rawSchemas: RawSchema[]) {
    this.stableSchemas.value = rawSchemas as any;
    this.stableSchemas.value.forEach(this.processSchema.bind(this));

    watch(
      () => this.model.value,
      (newValue) => {
        if (!isEqual(newValue, this.prevModelState.value)) {
          for (const key of Object.keys(newValue)) {
            if (!isEqual(newValue[key], this.prevModelState.value[key])) {
              if (this.effects[key]) {
                Array.from(this.effects[key])?.forEach((effect) => {
                  effect();
                });
              }
            }
          }
          this.prevModelState.value = cloneDeep(newValue);
        }
      },
      {
        deep: true,
      }
    );
  }

  processSchema(rawSchema: AnyObject) {
    rawSchema[this.schemaIdkey] = v4();
    this.stableEachKey({
      target: rawSchema,
    });
  }

  stableEachKey({ target, rawUpdate }: StableEachKeyOptions) {
    Object.keys(target).forEach((key) => {
      this.processValueOrFunction({
        target,
        input: get(target, key),
        key,
        update: (stable) => {
          rawUpdate
            ? rawUpdate(set(target, key, stable))
            : set(target, key, stable);
        },
      });
    });
  }

  handleDefaultValue(target: AnyObject) {
    let afterModelUpdateEffects = this.afterModelUpdateEffects.get(target);
    if (!afterModelUpdateEffects) {
      afterModelUpdateEffects = new Set();
    }
    afterModelUpdateEffects.add(() => {
      this.modelProcessProgress.set(target, true);
    });
    this.afterModelUpdateEffects.set(target, afterModelUpdateEffects);
  }

  createProxyedModel({
    update,
    input,
    isHandlingDefaultValue,
    target,
    key,
  }: AnyObject) {
    return new Proxy(
      {},
      {
        get: (_, field: string) => {
          let keysWithEffectsByTarget =
            this.keysWithEffectsByTargetWithEffects.get(target);
          if (!keysWithEffectsByTarget) {
            keysWithEffectsByTarget = new Set();
          }
          keysWithEffectsByTarget.add(key);
          this.keysWithEffectsByTargetWithEffects.set(
            target,
            keysWithEffectsByTarget
          );
          const fieldEffects = this.effects[field];
          if (!fieldEffects) {
            this.effects[field] = new Set();
          }
          if (update) {
            const effect = () => {
              const executionResult = input({ model: this.model.value });
              this.processValueSyncOrAsync({
                input: executionResult,
                key,
                excludeDeepProcessing:
                  this.nonDeepProcessableKeys.includes(key),
                rawUpdate: update,
                update: (res: any) => {
                  update(res);
                  if (isHandlingDefaultValue) {
                    let afterModelUpdateEffects =
                      this.afterModelUpdateEffects.get(target);
                    if (!afterModelUpdateEffects) {
                      afterModelUpdateEffects = new Set();
                    }
                    afterModelUpdateEffects.add(() => {
                      this.modelProcessProgress.set(target, true);
                    });
                    this.afterModelUpdateEffects.set(
                      target,
                      afterModelUpdateEffects
                    );
                    this.effects[field].delete(effect);
                  }
                },
              });
            };
            this.effects[field].add(effect);
          }
          return this.model.value[field];
        },
      }
    );
  }

  processValueSyncOrAsync({
    input,
    update,
    rawUpdate,
    excludeDeepProcessing,
  }: AnyObject) {
    if (input instanceof Promise) {
      input.then((res) => {
        if (isPlainObject(res) && !excludeDeepProcessing) {
          this.stableEachKey({
            target: res,
            rawUpdate,
          });
        } else {
          update(res);
        }
      });
    } else {
      if (isPlainObject(input) && !excludeDeepProcessing) {
        this.stableEachKey({
          target: input,
          rawUpdate,
        });
      } else {
        update(input);
      }
    }
  }

  processValueOrFunction({
    target,
    input,
    update,
    key,
  }: ProcessValueOrFunctionOptions) {
    const isHandlingDefaultValue = key === "defaultValue";
    if (isFunction(input)) {
      const fnRes = input({
        model: this.createProxyedModel({
          update,
          input,
          target,
          key,
          isHandlingDefaultValue,
        }),
      });
      // undefined 意味着过程中的值
      update?.(undefined);

      this.processValueSyncOrAsync({
        input: fnRes,
        key,
        excludeDeepProcessing: this.nonDeepProcessableKeys.includes(key),
        rawUpdate: update,
        update: (res: any) => {
          if (update) {
            if (
              isHandlingDefaultValue &&
              !this.keysWithEffectsByTargetWithEffects.get(target)?.has(key)
            ) {
              this.handleDefaultValue(target);
            }
            update(res);
          }
        },
      });
    } else {
      if (update) {
        if (isHandlingDefaultValue) {
          this.handleDefaultValue(target);
        }
        this.processValueSyncOrAsync({
          input,
          update,
          key,
          excludeDeepProcessing: this.nonDeepProcessableKeys.includes(key),
        });
      }
    }
  }
}
