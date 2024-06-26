export interface RawSchema {}

export interface StableEachKeyOptions {
  target: any;
  rawUpdate?: AnyFunction;
}

export interface ProcessValueOrFunctionOptions {
  input: any;
  update?: AnyFunction;
  afterUpdate?: AnyFunction;
  key?: any;
  target?: any;
}
