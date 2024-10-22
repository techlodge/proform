import GlobalConfiguration from "@/core/Configurations/Global";
import { Customizations } from "@/core/Processors/Data/types";
import { ref } from "vue";
import { cloneDeep, merge } from "lodash-es";
import { AnyObject } from "@/global";

export default class RuntimeHandler {
  placeholderPreset: Record<string, string>;
  constructor() {
    this.placeholderPreset = this.handlePlaceholderPreset();
  }

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

  private handlePlaceholderPreset() {
    // prefix -> [avaliable component names]
    // 都用小写，这样可以做相似性碰撞
    const userFriendlyPreset: AnyObject = {
      请选择: ["select", "tree", "cascader"],
      请输入: ["input"],
    };
    const transformed: AnyObject = {};
    for (const key in userFriendlyPreset) {
      userFriendlyPreset[key].forEach((value: string) => {
        transformed[value] = key;
      });
    }
    return transformed;
  }
}
