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
  children: StabledItemSchema[] | ((context: Context) => StabledItemSchema[]);
};

export type StabledSchema = StabledItemSchema | StabledListSchema;

export type PartialStabledSchema = {
  type?: "item" | "list";
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
  children?: StabledItemSchema[] | ((context: Context) => StabledItemSchema[]);
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
  children: SchemaTransformer<RawSchema[]>;
};

export type RawSchema = RawItemSchema | RawListSchema;

export interface Context {
  model: AnyObject;
  published: AnyObject;
  publish: (data: AnyObject) => any;
  hydrate: (data: AnyObject) => any;
}

export type SchemaTransformer<T> =
  | T
  | ((context: Context) => T)
  | ((context: Context) => Promise<T>);

export interface StableEachKeyOptions {
  target: RawSchema;
  rawUpdate?: AnyFunction;
}

export interface ProcessValueOrFunctionOptions {
  input: AnyFunction;
  update: AnyFunction;
  afterUpdate?: AnyFunction;
  key: string;
  target: RawSchema;
}

export interface CreateProxyedModelOptions {
  update: AnyFunction;
  input: AnyFunction;
  isHandlingDefaultValue: boolean;
  target: RawSchema;
  key: string;
}
