export interface RawSchema {}

export interface StableEachKeyOptions {
  target: any;
}

export interface ProcessValueOrFunctionOptions {
  input: any;
  update?: AnyFunction;
  afterUpdate?: AnyFunction;
  key?: any;
  target?: any;
}
