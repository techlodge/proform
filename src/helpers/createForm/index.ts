import { FormCreateOptions } from "./types";
import FormCreateProcessor from "@/core/Processors/FormCreate";

export function createForm(formCreateOptions: FormCreateOptions) {
  const formCreateProcessor = new FormCreateProcessor(formCreateOptions);
  const renderRuntime = formCreateProcessor.renderRuntime;
  return [
    renderRuntime.execute(),
    {
      submit() {},
      publish: renderRuntime.publish.bind(renderRuntime),
    },
  ] as const;
}
