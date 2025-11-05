export type ThresholdConfig<TPayload> = Record<number, TPayload> & { default: TPayload }

export type ThresholdResult<TPayload> = { value: number | undefined; payload: TPayload }
