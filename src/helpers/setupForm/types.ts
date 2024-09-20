import { AnyFunction, AnyPromiseFunction } from "@/global";

export type Component = any;

export type BuiltinAdapter = "ArcoDesign" | (string & {});

export interface CustomizedAdapter {
  // 用来描述 FormItem 上的 field 对应的路径
  adaptiveFormElementPath: AnyFunction;
  // 用来表述 FormItem 对应的表单数据对象
  adaptiveFormData: AnyFunction;
  // 用来描述 FormItem 里的组件的校验
  adaptiveValidate: AnyPromiseFunction;
  // 用来描述 FormItem 里的组件的清除校验
  adaptiveClearValidate: AnyFunction;
}

export interface Layouts {
  Form: Component;
  FormItem: Component;
  FormLayouts: {
    ListWrapper: Component;
    ListItem: Component;
  };
}

export type Templates = Record<
  string,
  | {
      layouts: Layouts;
      builtinAdapter: BuiltinAdapter;
    }
  | {
      layouts: Layouts;
      customizedAdapter: CustomizedAdapter;
    }
>;

export interface FormSetupOptions {
  templates: Templates;
  default: {
    template: string;
  };
}
