import { Customizations } from "@/core/Processors/Data/types";
import { ref } from "vue";

export default class RuntimeHandler {
  constructor() {}

  initFormPropsAndSlots() {
    return {
      formProps: ref({}),
      formSlots: ref({}),
    };
  }

  handleCustomizations(customizations?: Customizations) {
    if (!customizations) return {};
    const formCustomizations = customizations?.form;
    const formItemCustomizations = customizations?.formItem;
    return {
      formProps: formCustomizations?.props,
      formSlots: formCustomizations?.slots,
      formItemProps: formItemCustomizations?.props,
      formItemSlots: formItemCustomizations?.slots,
    };
  }
}
