export type Component = any;

export interface Layouts {
  Form: Component;
  FormItem: Component;
}

export type Templates = Record<
  string,
  {
    layouts: Layouts;
  }
>;

export interface FormSetupOptions {
  templates: Templates;
  default: {
    template: string;
  };
}
