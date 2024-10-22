import { AnyArray, AnyFunction, AnyObject } from "@/global";
import { VNode } from "vue";

export type DOMType = new (...args: any[]) => AnyObject & {
  $props: AnyObject;
};

type FlexibleType =
  | string
  | number
  | boolean
  | null
  | undefined
  | symbol
  | bigint
  | Function
  | object
  | {};

export interface Customizations {
  form?: {
    props?: AnyObject;
    slots?: AnyObject;
  };
  formItem?: {
    props?: AnyObject;
    slots?: AnyObject;
  };
  listLabel?: AnyFunction;
  layout?: {
    columns?: number;
    disabled?: boolean;
  };
}

export type ComponentType =
  | DOMType
  | VNode
  | ((context: Context) => DOMType | VNode);

export type StabledItemSchema = {
  type?: "item";
  label?: string;
  field: string;
  component: ComponentType;
  componentProps?: Record<string, SchemaTransformer<FlexibleType>>;
  defaultValue?: PropertyKey | object;
  hide?: boolean;
  destroy?: boolean;
  rules?: AnyArray;
  required?: boolean | string;
  customizations?: Customizations;
};

export type StabledListSchema = {
  type: "list";
  label?: string;
  field: string;
  children: StabledItemSchema[];
  showAddButton?: boolean;
  showDeleteButton?: boolean;
  minCount?: number;
  maxCount?: number;
  customizations?: Customizations;
};

export type StabledGroupSchema = {
  type: "group";
  label?: string;
  field?: string;
  children: StabledItemSchema[];
  customizations?: Customizations;
};

export type StabledSchema =
  | StabledItemSchema
  | StabledListSchema
  | StabledGroupSchema;

export type PartialStabledSchema = {
  type?: "item" | "list" | "group";
  label?: string;
  field: string;
  component?: ComponentType;
  componentProps?: Record<string, SchemaTransformer<FlexibleType>>;
  defaultValue?: PropertyKey | object;
  hide?: boolean;
  destroy?: boolean;
  rules?: AnyArray;
  required?: boolean | string;
  customizations?: Customizations;
  children?: StabledItemSchema[];
  showAddButton?: boolean;
  showDeleteButton?: boolean;
  minCount?: number;
  maxCount?: number;
  placeholder?: string;
};

export type RawItemSchema = {
  [K in keyof Omit<StabledItemSchema, "type">]: SchemaTransformer<
    StabledItemSchema[K]
  >;
};

export type RawListSchema = {
  type: "list";
  label?: SchemaTransformer<string>;
  field: SchemaTransformer<string>;
  children: RawSchema[];
  showAddButton?: SchemaTransformer<boolean>;
  showDeleteButton?: SchemaTransformer<boolean>;
  minCount?: SchemaTransformer<number>;
  maxCount?: SchemaTransformer<number>;
  customizations?: Customizations;
};

export type RawGroupSchema = {
  type: "group";
  label?: SchemaTransformer<string>;
  field?: SchemaTransformer<string>;
  children: RawSchema[];
  customizations?: Customizations;
};

export type RawSchema = RawItemSchema | RawListSchema | RawGroupSchema;

export interface Context {
  model: AnyObject;
  published: AnyObject;
  publish: (data: AnyObject) => any;
  hydrate: (data: AnyObject) => any;
  componentRefs: AnyObject;
}

export type SchemaTransformer<T> =
  | T
  | ((context: Context) => T)
  | ((context: Context) => Promise<T>);

export interface StableEachKeyOptions {
  target: RawSchema;
  parentTarget?: RawSchema;
  rawUpdate?: AnyFunction;
}

export interface ProcessValueOrFunctionOptions {
  input: AnyFunction;
  update: AnyFunction;
  afterUpdate?: AnyFunction;
  key: string;
  target: RawSchema;
  parentTarget?: RawSchema;
  rawUpdate?: AnyFunction;
}

export interface CreateProxyedModelOptions {
  update: AnyFunction;
  input: AnyFunction;
  isHandlingDefaultValue: boolean;
  target: RawSchema;
  key: string;
  parentTarget?: RawSchema;
  rawUpdate?: AnyFunction;
}
