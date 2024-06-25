import { RawSchema } from "@/core/Processors/Data/types";

export interface FormCreateOptions {
  template?: string;
  schemas:
    | RawSchema[]
    | ((...args: any) => RawSchema[])
    | ((...args: any[]) => Promise<RawSchema[]>);
}
