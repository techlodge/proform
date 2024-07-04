import { AnyFunction, AnyObject } from "@/global";

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

export interface StabledItemSchema {
  type?: "item";
  label?: string;
  field: string;
  component: DOMType;
  componentProps?: Record<string, SchemaTransformer<FlexibleType>>;
  defaultValue?: PropertyKey | object;
  hide?: boolean;
  destroy?: boolean;
}

export type StabledSchema = StabledItemSchema;

export interface Context {
  model: AnyObject;
  published: AnyObject;
  publish: (data: AnyObject) => any;
}

export type SchemaTransformer<T> =
  | T
  | ((context: Context) => T)
  | ((context: Context) => Promise<T>);

export type RawSchema = {
  [K in keyof StabledSchema]: SchemaTransformer<StabledSchema[K]>;
};

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
