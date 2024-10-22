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
  isNumber,
  isString,
  isUndefined,
  merge,
  set,
} from "lodash-es";
import { defineComponent, ref, toRaw } from "vue";
import SpanWrapper from "@/core/Runtimes/Render/LayoutWrappers/SpanWrapper";
import GridWrapper from "@/core/Runtimes/Render/LayoutWrappers/GridWrapper";

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
  componentRefs = {} as AnyObject;

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
      // @ts-expect-error
      update: (schemas) => {
        this.dataProcessor = new DataProcessor(this);
        return this.dataProcessor.processSchemas(cloneDeep(schemas));
      },
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
    let columns = stableSchema.customizations?.layout?.columns;
    switch (stableSchema.type) {
      case "item":
        return (
          <SpanWrapper columns={columns}>
            {this.renderItemSchema({
              schema: stableSchema,
            })}
          </SpanWrapper>
        );
      case "list":
        return (
          <SpanWrapper columns={columns}>
            {this.renderListSchema({
              schema: stableSchema as PartialStabledSchema,
            })}
          </SpanWrapper>
        );
      case "group":
        stableSchema.customizations?.layout?.columns &&
          (columns = stableSchema.customizations?.layout?.columns);
        return (
          <SpanWrapper columns={columns}>
            {this.renderGroupSchema({
              schema: stableSchema as PartialStabledSchema,
            })}
          </SpanWrapper>
        );
      default:
        stableSchema.customizations?.layout?.columns &&
          (columns = stableSchema.customizations?.layout?.columns);
        return (
          <SpanWrapper columns={columns}>
            {this.renderItemSchema({
              schema: stableSchema,
            })}
          </SpanWrapper>
        );
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
      listLabel,
    } = this.runtimeHandler.handleCustomizations(
      schema.customizations ?? parentSchema?.customizations,
      this.template
    );

    merge(this.formProps.value, formProps);
    merge(this.formSlots.value, formSlots);

    if (isString(schema.field)) {
      if (this.fieldsHasBeenSet.has(schema.field) && schema.defaultValue) {
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
        ) &&
        schema.defaultValue
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

    let { label, required, rules: originalRules, placeholder } = schema;
    if (!placeholder) {
      let prefix = "请输入";
      if (!isUndefined(Component.name)) {
        if (
          this.runtimeHandler.placeholderPreset[Component.name.toLowerCase()]
        ) {
          prefix =
            this.runtimeHandler.placeholderPreset[Component.name.toLowerCase()];
          placeholder = `${prefix}${label}`;
        } else {
          Object.keys(this.runtimeHandler.placeholderPreset).forEach((name) => {
            if (Component.name.toLowerCase().includes(name.toLowerCase())) {
              prefix = this.runtimeHandler.placeholderPreset[name];
            }
          });
          placeholder = `${prefix}${label}`;
        }
      } else {
        placeholder = `${prefix}${label}`;
      }
    }
    label = isFunction(listLabel) ? listLabel(label, modelIndex) : label;
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
          label={label}
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
              if (
                !this.componentRefs[
                  parentSchema?.field
                    ? `${parentSchema.field}.${modelIndex}.${schema.field}`
                    : schema.field
                ]
              ) {
                this.componentRefs[
                  parentSchema?.field
                    ? `${parentSchema.field}.${modelIndex}.${schema.field}`
                    : schema.field
                ] = ref();
              }
              return (
                <Component
                  ref={
                    this.componentRefs[
                      parentSchema?.field
                        ? `${parentSchema.field}.${modelIndex}.${schema.field}`
                        : schema.field
                    ]
                  }
                  placeholder={placeholder}
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
          add: ({ container: Container }: AnyObject) => {
            let showable = schema.showAddButton ?? true;
            if (isNumber(schema.maxCount)) {
              showable =
                showable &&
                this.model.value[schema.field].length < schema.maxCount;
            }
            return (
              showable && (
                <Container
                  onClick={() => {
                    this.model.value[schema.field].push(
                      cloneDeep(this.defaultValueModel[schema.field][0])
                    );
                  }}
                />
              )
            );
          },
          default: () => {
            return this.model.value[schema.field].map(
              (_: AnyObject, modelIndex: number) => (
                <this.layouts.FormLayouts.ListItem>
                  {{
                    default: () => {
                      return (
                        <GridWrapper>
                          {schema.children?.map((child) => {
                            let columns = 24;
                            child.customizations?.layout?.columns &&
                              (columns = child.customizations?.layout?.columns);
                            return (
                              <div
                                style={{
                                  gridColumn: `span ${columns}`,
                                }}
                              >
                                {this.renderItemSchema({
                                  schema: child,
                                  parentSchema: schema,
                                  modelIndex,
                                })}
                              </div>
                            );
                          })}
                        </GridWrapper>
                      );
                    },
                    delete: ({ container: Container }: AnyObject) => {
                      let showable = schema.showDeleteButton ?? true;
                      if (isNumber(schema.minCount)) {
                        showable =
                          showable &&
                          this.model.value[schema.field].length >
                            schema.minCount;
                      }
                      return (
                        showable && (
                          <Container
                            onClick={() => {
                              this.model.value[schema.field].splice(
                                modelIndex,
                                1
                              );
                            }}
                          />
                        )
                      );
                    },
                  }}
                </this.layouts.FormLayouts.ListItem>
              )
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
    const layoutDisabled = GlobalConfiguration.getLayoutDisabled(this.template);
    return defineComponent(() => {
      return () => (
        <this.layouts.Form
          {...this.formProps.value}
          {...this.adapters.adaptiveFormData(this.model.value)}
          ref={this.formRef}
          style={
            layoutDisabled
              ? {}
              : {
                  display: "grid",
                  gridTemplateColumns: "repeat(24, 1fr)",
                }
          }
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
