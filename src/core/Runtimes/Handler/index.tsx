import GlobalConfiguration from "@/core/Configurations/Global";
import { Customizations } from "@/core/Processors/Data/types";
import { ref } from "vue";
import { cloneDeep, merge } from "lodash-es";

export default class RuntimeHandler {
  constructor() {}

  initFormPropsAndSlots() {
    return {
      formProps: ref({}),
      formSlots: ref({}),
    };
  }

  handleCustomizations(_customizations?: Customizations, template?: string) {
    let customizations = merge(
      cloneDeep(
        GlobalConfiguration.getCustomizations(template as string) ?? {}
      ),
      _customizations ?? {}
    );
    if (!customizations) return {};
    const formCustomizations = customizations?.form;
    const formItemCustomizations = customizations?.formItem;
    return {
      formProps: formCustomizations?.props,
      formSlots: formCustomizations?.slots,
      formItemProps: formItemCustomizations?.props,
      formItemSlots: formItemCustomizations?.slots,
      listLabel: customizations?.listLabel,
      layout: customizations?.layout,
    };
  }
}
