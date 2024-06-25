import GlobalConfiguration from "@/core/Configurations/Global";
import { FormSetupOptions } from "./types";

/**
 *
 * themes concept
 */

export function setupForm(options: FormSetupOptions) {
  GlobalConfiguration.formSetupOptions = options;
}
