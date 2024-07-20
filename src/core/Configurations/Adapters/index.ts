import { ArcoDesignBuiltinAdapters } from "@/core/Configurations/Adapters/BuiltinAdapters/ArcoDesign";
import { BuiltinAdapter, CustomizedAdapter } from "@/helpers";

export const builtinAdaptersConfig: Record<BuiltinAdapter, CustomizedAdapter> =
  {
    ArcoDesign: ArcoDesignBuiltinAdapters,
  };
