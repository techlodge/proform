import { AnyFunction, AnyObject } from "@/global";
import { FormCreateOptions } from "./types";
import FormCreateProcessor from "@/core/Processors/FormCreate";
import { cloneDeep, isUndefined } from "lodash-es";
import { RawSchema } from "@/helpers/types";

/**
 * vision
 * 1、support i18n
 */

export function createForm(formCreateOptions: FormCreateOptions) {
  const formCreateProcessor = new FormCreateProcessor(formCreateOptions);
  const renderRuntime = formCreateProcessor.renderRuntime;

  return [
    renderRuntime.execute(),
    {
      submit() {
        return renderRuntime.adapters
          .adaptiveValidate(renderRuntime.formRef)
          .then(() => {
            return renderRuntime.model.value;
          });
      },
      publish(data: AnyObject) {
        Object.keys(data).forEach((k) => {
          renderRuntime.dataProcessor.publishedData.value[k] = data[k];
          const publishEffectsByKey: Set<AnyFunction> =
            renderRuntime.dataProcessor.publishEffects.get(k) ?? new Set();
          Array.from(publishEffectsByKey).forEach((effect) => effect());
        });
      },
      hydrate: (data: AnyObject) => {
        Object.keys(data).forEach((key) => {
          renderRuntime.fieldsHasBeenSet.add(key);
          renderRuntime.model.value[key] = data[key];
        });
      },
      reset({ model = true, validate = true } = {}) {
        const resetValidate = () =>
          renderRuntime.adapters.adaptiveClearValidate(renderRuntime.formRef);
        const resetModel = () => {
          Object.keys(renderRuntime.model.value).forEach((key) => {
            renderRuntime.model.value[key] = cloneDeep(
              renderRuntime.defaultValueModel[key]
            );
          });
        };
        const stack = [];
        if (model === true) {
          stack.push(resetModel);
        }
        if (validate === true) {
          stack.push(resetValidate);
        }
        if (isUndefined(model) && isUndefined(validate)) {
          stack.push(resetValidate);
          stack.push(resetModel);
        }
        stack.forEach((fn) => fn());
      },
      updateSchema(
        schema: RawSchema[],
        { clearPreviousState = true }: AnyObject
      ) {
        renderRuntime.formProps.value = {};
        renderRuntime.formSlots.value = {};
        if (!clearPreviousState) {
          renderRuntime.dataProcessor.processSchemas(schema);
          return;
        }

        function extractUniqueFields(schemas: RawSchema[]): string[] {
          const fields = new Set<string>();
          schemas.forEach((schema) => {
            if (schema.field) {
              fields.add(schema.field as string);
            }
          });
          return Array.from(fields);
        }

        renderRuntime.dataProcessor.processSchemas(schema);
        const schemas = cloneDeep(renderRuntime.stableSchemas.value);
        const uniqueFields = extractUniqueFields(schemas);

        renderRuntime.model.value = cloneDeep(renderRuntime.defaultValueModel);

        Object.keys(renderRuntime.model.value).forEach((key) => {
          if (!uniqueFields.includes(key)) {
            delete renderRuntime.model.value[key];
          }
        });
      },
    },
  ] as const;
}
