import { AnyFunction, AnyObject } from "@/global";
import { FormCreateOptions } from "./types";
import FormCreateProcessor from "@/core/Processors/FormCreate";
import { isUndefined } from "lodash-es";

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
            renderRuntime.model.value[key] =
              renderRuntime.defaultValueModel[key];
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
    },
  ] as const;
}
