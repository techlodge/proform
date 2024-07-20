import { AnyFunction, AnyObject } from "@/global";
import { FormCreateOptions } from "./types";
import FormCreateProcessor from "@/core/Processors/FormCreate";

export function createForm(formCreateOptions: FormCreateOptions) {
  const formCreateProcessor = new FormCreateProcessor(formCreateOptions);
  const renderRuntime = formCreateProcessor.renderRuntime;
  return [
    renderRuntime.execute(),
    {
      submit() {},
      publish(data: AnyObject) {
        Object.keys(data).forEach((k) => {
          renderRuntime.dataProcessor.publishedData.value[k] = data[k];
          const publishEffectsByKey: Set<AnyFunction> =
            renderRuntime.dataProcessor.publishEffects.get(k) ?? new Set();
          Array.from(publishEffectsByKey).forEach((effect) => effect());
        });
      },
    },
  ] as const;
}
