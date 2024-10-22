import { AnyObject } from "@/global";
import { CustomizedAdapter } from "@/helpers";

export const NutUIBuiltinAdapters: CustomizedAdapter = {
  adaptiveFormElementPath(prop) {
    return { prop };
  },
  adaptiveFormData(modelValue) {
    return {
      modelValue,
    };
  },
  adaptiveValidate(formRef: AnyObject) {
    return formRef.value.validate().then(({ valid, errors }: AnyObject) => {
      if (!valid) {
        return Promise.reject(errors);
      }
      return Promise.resolve();
    });
  },
  adaptiveClearValidate(formRef: AnyObject) {
    return formRef.value?.reset?.();
  },
};
