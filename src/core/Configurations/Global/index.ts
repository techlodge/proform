import { FormSetupOptions } from "@/helpers/setupForm/types";

export default class GlobalConfiguration {
  static formSetupOptions: FormSetupOptions;

  static getTemplate(template?: string) {
    return template ?? GlobalConfiguration.formSetupOptions.default.template;
  }

  static getLayoutsByTemplate(template: string) {
    return GlobalConfiguration.formSetupOptions.templates[template].layouts;
  }
}
