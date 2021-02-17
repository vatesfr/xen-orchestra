export interface Effects {
  [fnName: string]: (...params: unknown[]) => void | Record<string,unknown>
}

export interface State {
  [propName: string]: unknown
}

export interface Props {
  [propName: string]: unknown
}

export interface RenderParams {
  readonly effects: Effects
  readonly state: State
  readonly [propName: string]: unknown
}

export interface EffectContext {
  readonly effects: Effects
  readonly state: State
  readonly props: Props
}
