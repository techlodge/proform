import { FormCreateOptions } from "./types";
import FormCreateProcessor from "@/core/Processors/FormCreate";

export function createForm(formCreateOptions: FormCreateOptions) {
  const formCreateProcessor = new FormCreateProcessor(formCreateOptions);
  return [
    formCreateProcessor.renderRuntime.execute(),
    {
      submit() {},
    },
  ] as const;
}
