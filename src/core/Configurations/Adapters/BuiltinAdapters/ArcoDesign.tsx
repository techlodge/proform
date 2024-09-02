import { AnyObject } from "@/global";
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
  adaptiveValidate(formRef: AnyObject) {
    return formRef.value.validate().then((errors?: AnyObject) => {
      if (errors) {
        return Promise.reject(errors);
      }
      return Promise.resolve();
    });
  },
  adaptiveClearValidate(formRef: AnyObject) {
    return formRef.value.clearValidate();
  },
};
