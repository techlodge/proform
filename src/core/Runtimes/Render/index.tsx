import { builtinAdaptersConfig } from "@/core/Configurations/Adapters";
import GlobalConfiguration from "@/core/Configurations/Global";
import DataProcessor from "@/core/Processors/Data";
import {
  DOMType,
  PartialStabledSchema,
  StabledSchema,
} from "@/core/Processors/Data/types";
import RuntimeHandler from "@/core/Runtimes/Handler";
import { RenderOptions } from "@/core/Runtimes/Render/types";
import { AnyObject } from "@/global";
import { FormCreateOptions } from "@/helpers/createForm/types";
import { CustomizedAdapter, Layouts } from "@/helpers/setupForm/types";
import { produce } from "immer";
import {
  cloneDeep,
  get,
  isBoolean,
  isFunction,
  isString,
  merge,
  set,
} from "lodash-es";
import { defineComponent, ref, toRaw } from "vue";

export default class RenderRuntime {
  layouts: Layouts;
  template: string;
  adapters: CustomizedAdapter;
  dataProcessor;
  stableSchemas = ref<StabledSchema[]>([]);
  model = ref<AnyObject>({});
  defaultValueModel: AnyObject = produce({}, () => {});
  fieldsHasBeenSet = new Set<string>();
  formRef = ref();
  runtimeHandler: RuntimeHandler;
  formProps;
  formSlots;

  constructor(public formCreateOption: FormCreateOptions) {
    this.template = GlobalConfiguration.getTemplate(formCreateOption.template);
    this.layouts = GlobalConfiguration.getLayoutsByTemplate(this.template);
    const template =
      GlobalConfiguration.formSetupOptions.templates[this.template];
    // @ts-expect-error
    const builtinAdapter = template.builtinAdapter;
    this.adapters = builtinAdapter
      ? builtinAdaptersConfig[builtinAdapter]
      : // @ts-expect-error
        template.customizedAdapter;
    this.dataProcessor = new DataProcessor(this);
    this.processRawSchemas({
      input: formCreateOption.schemas,
      update: this.dataProcessor.processSchemas.bind(this.dataProcessor),
    });
    this.runtimeHandler = new RuntimeHandler();
    const inited = this.runtimeHandler.initFormPropsAndSlots();
    this.formProps = inited.formProps;
    this.formSlots = inited.formSlots;
  }

  processRawSchemas({ input, update }: AnyObject) {
    if (isFunction(input)) {
      const fnRes = input();
      if (fnRes instanceof Promise) {
        fnRes.then((schemas) => {
          update(schemas);
        });
      } else {
        update(fnRes);
      }
    } else {
      update(input);
    }
  }

  renderSchema(stableSchema: StabledSchema) {
    switch (stableSchema.type) {
      case "item":
        return this.renderItemSchema({
          schema: stableSchema,
        });
      case "list":
        return this.renderListSchema({
          schema: stableSchema as PartialStabledSchema,
        });
      case "group":
        return this.renderGroupSchema({
          schema: stableSchema as PartialStabledSchema,
        });
      default:
        return this.renderItemSchema({
          schema: stableSchema,
        });
    }
  }

  renderItemSchema({ schema, parentSchema, modelIndex }: RenderOptions) {
    const Component = toRaw(schema.component) as DOMType;
    if (!Component) return;

    const {
      formProps = {},
      formSlots = {},
      formItemProps = {},
      formItemSlots = {},
    } = this.runtimeHandler.handleCustomizations(schema.customizations);

    merge(this.formProps.value, formProps);
    merge(this.formSlots.value, formSlots);

    if (isString(schema.field)) {
      if (this.fieldsHasBeenSet.has(schema.field)) {
        this.dataProcessor.modelProcessProgress.set(
          parentSchema?.field
            ? `${parentSchema.field}.${schema.field}`
            : schema.field,
          true
        );
      }
      if (
        !this.dataProcessor.modelProcessProgress.get(
          parentSchema?.field
            ? `${parentSchema.field}.${schema.field}`
            : schema.field
        )
      ) {
        set(
          this.model.value,
          parentSchema?.field
            ? `${parentSchema.field}.${modelIndex}.${schema.field}`
            : schema.field,
          schema.defaultValue
        );

        Array.from(
          this.dataProcessor.afterModelUpdateEffects.get(
            parentSchema?.field
              ? `${parentSchema.field}.${schema.field}`
              : schema.field
          ) ?? []
        ).forEach((effect) => effect());
      }
    }

    const showable = !schema.hide && !schema.destroy;
    if (schema.destroy) {
      delete this.model.value[schema.field];
    }

    const { label, required, rules: originalRules } = schema;
    const defaultRequiredMessage = `${label}是必填项`;
    const rules = originalRules ? [...originalRules] : [];
    const requiredRuleIndex = rules.findIndex((rule) => rule.required);
    if (isString(required)) {
      const rule = { required: true, message: required };
      if (requiredRuleIndex >= 0) {
        rules[requiredRuleIndex] = rule;
      } else {
        rules.unshift(rule);
      }
    } else if (isBoolean(required) && required) {
      const rule = { required: true, message: defaultRequiredMessage };
      if (requiredRuleIndex >= 0) {
        rules[requiredRuleIndex] = rule;
      } else {
        rules.unshift(rule);
      }
    }

    return (
      showable && (
        <this.layouts.FormItem
          {...formItemProps}
          label={schema.label}
          rules={rules}
          {...this.adapters.adaptiveFormElementPath(
            parentSchema?.field
              ? `${parentSchema.field}.${modelIndex}.${schema.field}`
              : schema.field
          )}
        >
          {{
            ...formItemSlots,
            default: () => {
              return (
                <Component
                  {...schema.componentProps}
                  modelValue={get(
                    this.model.value,
                    parentSchema?.field
                      ? `${parentSchema.field}.${modelIndex}.${schema.field}`
                      : schema.field
                  )}
                  onUpdate:modelValue={(value: any) => {
                    set(
                      this.model.value,
                      parentSchema?.field
                        ? `${parentSchema.field}.${modelIndex}.${schema.field}`
                        : schema.field,
                      value
                    );
                  }}
                />
              );
            },
          }}
        </this.layouts.FormItem>
      )
    );
  }

  renderListSchema({ schema }: RenderOptions) {
    if (!this.model.value[schema.field]) {
      this.model.value[schema.field] = [{}];
    }
    return (
      <this.layouts.FormLayouts.ListWrapper>
        {{
          label: () => {
            return schema.label;
          },
          add: () => {
            return (
              <div
                onClick={() => {
                  this.model.value[schema.field].push(
                    cloneDeep(this.defaultValueModel[schema.field][0])
                  );
                }}
              >
                add
              </div>
            );
          },
          default: () => {
            return this.model.value[schema.field].map(
              (_: AnyObject, modelIndex: number) =>
                schema.children?.map((child) => (
                  <this.layouts.FormLayouts.ListItem key={child.field}>
                    {this.renderItemSchema({
                      schema: child,
                      parentSchema: schema,
                      modelIndex,
                    })}
                  </this.layouts.FormLayouts.ListItem>
                ))
            );
          },
        }}
      </this.layouts.FormLayouts.ListWrapper>
    );
  }

  renderGroupSchema({ schema }: RenderOptions) {
    return (
      <this.layouts.FormLayouts.GroupWrapper>
        {{
          label: () => {
            return schema.label;
          },
          default: () => {
            return schema.children?.map(this.renderSchema.bind(this));
          },
        }}
      </this.layouts.FormLayouts.GroupWrapper>
    );
  }
  execute(): typeof this.layouts.Form {
    return defineComponent(() => {
      return () => (
        <this.layouts.Form
          {...this.formProps.value}
          {...this.adapters.adaptiveFormData(this.model.value)}
          ref={this.formRef}
        >
          {{
            ...this.formSlots.value,
            default: () => {
              return this.stableSchemas.value.map(this.renderSchema.bind(this));
            },
          }}
        </this.layouts.Form>
      );
    });
  }
}
