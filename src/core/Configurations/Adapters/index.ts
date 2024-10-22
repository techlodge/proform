import { ArcoDesignBuiltinAdapters } from "@/core/Configurations/Adapters/BuiltinAdapters/ArcoDesign";
import { NutUIBuiltinAdapters } from "@/core/Configurations/Adapters/BuiltinAdapters/NutUI";
import { BuiltinAdapter, CustomizedAdapter } from "@/helpers";

export const builtinAdaptersConfig: Record<BuiltinAdapter, CustomizedAdapter> =
  {
    ArcoDesign: ArcoDesignBuiltinAdapters,
    NutUI: NutUIBuiltinAdapters,
  };
