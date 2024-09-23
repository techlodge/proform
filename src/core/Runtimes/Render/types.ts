import { PartialStabledSchema } from "@/core/Processors/Data/types";

export interface RenderOptions {
  schema: PartialStabledSchema; // 当前 schema
  parentSchema?: PartialStabledSchema; // 父级 schema
  modelIndex?: number; // 数据索引
}
