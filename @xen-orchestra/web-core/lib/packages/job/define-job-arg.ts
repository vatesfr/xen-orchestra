export type JobIdentity = string | number | boolean | null | undefined

export type JobArg<TType = any, TToArray extends boolean = boolean> = {
  identify: ((source: TType) => JobIdentity) | (TType extends JobIdentity ? boolean : false)
  toArray: TToArray
}

export function defineJobArg<TType>(config: JobArg<TType, true>): JobArg<TType, true>
export function defineJobArg<TType>(config: JobArg<TType, false>): JobArg<TType, false>
export function defineJobArg<TType>(config: JobArg<TType>): JobArg<TType> {
  return config
}
