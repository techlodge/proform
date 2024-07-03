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
  isString,
  set,
} from "lodash";
import { Ref, nextTick, ref, watch } from "vue";

export default class DataProcessor {
  stableSchemas: Ref<StabledSchema[]>; // stableSchmeas from RenderRuntime
  model: Ref<AnyObject>;
  effects: Record<string, Set<AnyFunction>> = {};
  effetcsFilter = new Set();
  keysUsingFieldByTarget = new Map();
  afterModelUpdateEffects = new Map<AnyObject, Set<AnyFunction>>();
  modelProcessProgress = new Map();
  prevModelState;
  nonDeepProcessableKeys = ["component"];
  fieldsWithEffects = new Map();
  publishedKey = Symbol("publishedKey");
  publishedData = ref({});
  publishEffects = new Map();
  publishEffectsFilter = new Map();

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
        if (isEqual(newValue, this.prevModelState.value)) return;

        for (const key of Object.keys(newValue)) {
          if (
            !isEqual(newValue[key], this.prevModelState.value[key]) &&
            this.effects[key]
          ) {
            Array.from(this.effects[key]).forEach((effect) => effect());
          }
        }
        this.prevModelState.value = cloneDeep(newValue);
      },
      { deep: true }
    );
  }

  processSchema(rawSchema: AnyObject) {
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
    let afterModelUpdateEffects =
      this.afterModelUpdateEffects.get(target) ?? new Set();
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
    const proxyedModel = new Proxy(
      {
        [this.publishedKey]: new Proxy(
          {},
          {
            get: (_, field) => {
              const currentKeyFilters =
                this.publishEffectsFilter.get(key) ?? {};
              if (!currentKeyFilters[field]) {
                currentKeyFilters[field] = new Set();
              }
              if (currentKeyFilters[field].has(update)) return;
              currentKeyFilters[field].add(update);
              this.publishEffectsFilter.set(key, currentKeyFilters);

              // 收集当前 target 的哪些 key 使用到了 field，用来在后续处理数据时作为数据判断时机选择的依据
              let keysWithEffectsByTarget =
                this.keysUsingFieldByTarget.get(target) ?? new Set();
              keysWithEffectsByTarget.add(key);
              this.keysUsingFieldByTarget.set(target, keysWithEffectsByTarget);

              const publishEffectsByKey =
                this.publishEffects.get(field) ?? new Set();
              const effect = () => {
                const executionResult = input({
                  model: this.model.value,
                  published: this.publishedData.value,
                  publish: (data: AnyObject) => {
                    proxyedModel[this.publishedKey] = data;
                  },
                });
                this.processValueSyncOrAsync({
                  input: executionResult,
                  key,
                  rawUpdate: update,
                  update: (res: any) => {
                    update(res);
                    if (isHandlingDefaultValue) {
                      this.handleDefaultValue(target);
                      publishEffectsByKey.delete(effect);
                    }
                  },
                });
              };
              publishEffectsByKey.add(effect);
              this.publishEffects.set(field, publishEffectsByKey);
              // @ts-expect-error
              return this.publishedData.value[field];
            },
            set: (_, field, value) => {
              // @ts-expect-error
              const result = (this.publishedData.value[field] = value);
              const publishEffectsByKey: Set<AnyFunction> =
                this.publishEffects.get(field);
              if (!publishEffectsByKey) {
                // TODO: refactor later
                console.warn(
                  `[ProForm warn]: Unused published field ${
                    field as string
                  }. Expected the field to be utilized within the scope, but it was not referenced.`
                );
                return true;
              }
              Array.from(publishEffectsByKey).forEach((effect) => effect());
              return result;
            },
          }
        ),
      },
      {
        get: (_, field: string) => {
          // @ts-expect-error should pass
          if (field === this.publishedKey) {
            return _[this.publishedKey];
          } // 收集在处理默认值阶段时，当前 field 被哪些 target 的处理过程所使用，用于跳过对相应默认值的处理
          if (isHandlingDefaultValue) {
            const targets = this.fieldsWithEffects.get(field) ?? new Set();
            targets.add(target);
            this.fieldsWithEffects.set(field, targets);
          }
          // 收集当前 target 的哪些 key 使用到了 field，用来在后续处理数据时作为数据判断时机选择的依据
          let keysWithEffectsByTarget =
            this.keysUsingFieldByTarget.get(target) ?? new Set();
          keysWithEffectsByTarget.add(key);
          this.keysUsingFieldByTarget.set(target, keysWithEffectsByTarget);
          this.effects[field] = this.effects[field] ?? new Set();
          if (update) {
            if (this.effetcsFilter.has(input)) return;
            this.effetcsFilter.add(input);

            const effect = () => {
              const executionResult = input({
                model: this.model.value,
                published: this.publishedData.value,
                publish: (data: AnyObject) => {
                  proxyedModel[this.publishedKey] = data;
                },
              });
              this.processValueSyncOrAsync({
                input: executionResult,
                key,
                excludeDeepProcessing:
                  this.nonDeepProcessableKeys.includes(key),
                rawUpdate: update,
                update: (res: any) => {
                  update(res);
                  if (isHandlingDefaultValue) {
                    this.handleDefaultValue(target);
                    this.effects[field].delete(effect);
                  }
                },
              });
            };
            this.effects[field].add(effect);
          }

          return this.model.value[field];
        },
        set: (_, field, value) => {
          if (field === this.publishedKey) {
            Object.keys(value).forEach((valueKey) => {
              // @ts-expect-error
              _[this.publishedKey][valueKey] = value[valueKey];
            });
          }
          return true;
        },
      }
    );
    return proxyedModel;
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
    nextTick(() => {
      if (!target.hasOwnProperty("defaultValue") && isString(target.field)) {
        if (this.fieldsWithEffects.has(target.field)) {
          Array.from(this.fieldsWithEffects.get(target.field)).forEach(
            (_target) => {
              this.modelProcessProgress.set(_target, true);
            }
          );
        }
        this.modelProcessProgress.set(target, true);
      }
    });
    const isHandlingDefaultValue = key === "defaultValue";
    if (isFunction(input)) {
      const proxyedModel = this.createProxyedModel({
        update,
        input,
        target,
        key,
        isHandlingDefaultValue,
      });
      const fnRes = input({
        model: proxyedModel,
        published: proxyedModel[this.publishedKey],
        publish: (data: AnyObject) => {
          proxyedModel[this.publishedKey] = data;
        },
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
              !this.keysUsingFieldByTarget.get(target)?.has(key)
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
          rawUpdate: update,
          key,
          excludeDeepProcessing: this.nonDeepProcessableKeys.includes(key),
        });
      }
    }
  }
}
