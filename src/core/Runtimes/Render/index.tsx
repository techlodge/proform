import { builtinAdaptersConfig } from "@/core/Configurations/Adapters";
import GlobalConfiguration from "@/core/Configurations/Global";
import DataProcessor from "@/core/Processors/Data";
import { StabledSchema } from "@/core/Processors/Data/types";
import { RenderOptions } from "@/core/Runtimes/Render/types";
import { AnyObject } from "@/global";
import { FormCreateOptions } from "@/helpers/createForm/types";
import { CustomizedAdapter, Layouts } from "@/helpers/setupForm/types";
import { get, isFunction, isString, set } from "lodash";
import { defineComponent, ref, toRaw } from "vue";

export default class RenderRuntime {
  layouts: Layouts;
  template: string;
  adapters: CustomizedAdapter;
  dataProcessor;
  stableSchemas = ref<StabledSchema[]>([]);
  model = ref<AnyObject>({});
  fieldsHasBeenSet = new Set<string>();
  formRef = ref();

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
      default:
        return this.renderItemSchema({
          schema: stableSchema,
        });
    }
  }

  renderItemSchema({ schema }: RenderOptions) {
    const Component = toRaw(schema.component);
    if (!Component) return;

    if (isString(schema.field)) {
      if (this.fieldsHasBeenSet.has(schema.field)) {
        this.dataProcessor.modelProcessProgress.set(schema, true);
      }
      if (!this.dataProcessor.modelProcessProgress.get(schema)) {
        set(this.model.value, schema.field, schema.defaultValue);
        Array.from(
          this.dataProcessor.afterModelUpdateEffects.get(schema) ?? []
        ).forEach((effect) => effect());
      }
    }

    const showable = !schema.hide && !schema.destroy;
    if (schema.destroy) {
      delete this.model.value[schema.field];
    }

    return (
      showable && (
        <this.layouts.FormItem
          label={schema.label}
          {...this.adapters.adaptiveFormElementPath(schema.field)}
        >
          <Component
            {...schema.componentProps}
            modelValue={get(this.model.value, schema.field)}
            onUpdate:modelValue={(value: any) => {
              set(this.model.value, schema.field, value);
            }}
          ></Component>
        </this.layouts.FormItem>
      )
    );
  }

  execute(): typeof this.layouts.Form {
    const that = this;
    return defineComponent({
      setup() {
        return () => (
          <that.layouts.Form
            {...that.adapters.adaptiveFormData(that.model.value)}
            ref={that.formRef}
          >
            {{
              default() {
                return that.stableSchemas.value.map(
                  that.renderSchema.bind(that)
                );
              },
            }}
          </that.layouts.Form>
        );
      },
    });
  }
}
