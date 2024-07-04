import GlobalConfiguration from "@/core/Configurations/Global";
import DataProcessor from "@/core/Processors/Data";
import { StabledSchema } from "@/core/Processors/Data/types";
import { RenderOptions } from "@/core/Runtimes/Render/types";
import { AnyFunction, AnyObject } from "@/global";
import { FormCreateOptions } from "@/helpers/createForm/types";
import { Layouts } from "@/helpers/setupForm/types";
import { get, isFunction, isString, set } from "lodash";
import { ref, toRaw } from "vue";

export default class RenderRuntime {
  layouts: Layouts;
  dataProcessor;
  stableSchemas = ref<StabledSchema[]>([]);
  model = ref<AnyObject>({});

  constructor(public formCreateOption: FormCreateOptions) {
    this.layouts = GlobalConfiguration.genLayoutsByTemplate(
      formCreateOption.template
    );
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
        <this.layouts.FormItem label={schema.label}>
          <Component
            {...schema.componentProps}
            field={schema.field}
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
    return (
      <this.layouts.Form v-model={this.model.value}>
        {{
          default() {
            return that.stableSchemas.value.map(that.renderSchema.bind(that));
          },
        }}
      </this.layouts.Form>
    );
  }

  publish(data: AnyObject) {
    Object.keys(data).forEach((k) => {
      this.dataProcessor.publishedData.value[k] = data[k];
      const publishEffectsByKey: Set<AnyFunction> =
        this.dataProcessor.publishEffects.get(k) ?? new Set();
      Array.from(publishEffectsByKey).forEach((effect) => effect());
    });
  }
}
