import RenderRuntime from "@/core/Runtimes/Render";
import { FormCreateOptions } from "@/helpers/createForm/types";

export default class FormCreateProcessor {
  constructor(formCreateOption: FormCreateOptions) {
    this.renderRuntime = new RenderRuntime(formCreateOption);
  }
  renderRuntime: RenderRuntime;
}
