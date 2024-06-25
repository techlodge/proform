import { FormSetupOptions } from "@/helpers/setupForm/types";

export default class GlobalConfiguration {
  static formSetupOptions: FormSetupOptions;
  static genLayoutsByTemplate(template?: string) {
    if (template) {
      return GlobalConfiguration.formSetupOptions.templates[template].layouts;
    }
    return GlobalConfiguration.formSetupOptions.templates[
      GlobalConfiguration.formSetupOptions.default.template
    ].layouts;
  }
}
