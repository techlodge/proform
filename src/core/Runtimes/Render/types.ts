import { Component } from "@/helpers/setupForm/types";

export interface StabledSchema {
  type?: "item" | "group" | "list";
  label?: string;
  field: string;
  component: Component;
  componentProps?: AnyObject;
  defaultValue?: any;
  hide?: boolean;
  destroy?: boolean;
}

export interface RenderOptions {
  schema: StabledSchema; // 当前 schema
}
