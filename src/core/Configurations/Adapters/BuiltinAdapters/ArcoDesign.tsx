import { CustomizedAdapter } from "@/helpers";

export const ArcoDesignBuiltinAdapters: CustomizedAdapter = {
  adaptiveFormElementPath(field) {
    return { field };
  },
  adaptiveFormData(model) {
    return {
      model,
    };
  },
  adaptiveClearValidate() {
    return;
  },
};
