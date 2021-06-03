type RenderParams<State, Props, Effects, Computed, ParentState, ParentEffects> = {
  readonly effects: Effects & ParentEffects
  readonly state: State & ParentState & Computed
  readonly resetState: () => void
} & Props

interface EffectContext<State, Props, Effects, Computed, ParentState, ParentEffects> {
  readonly effects: Effects & ParentEffects
  readonly state: State & ParentState & Computed
  readonly props: Props
}

interface StateSpec<State, Props, Effects, Computed, ParentState, ParentEffects> {
  initialState?: State | ((props: Props) => State) // what about Reaclette's state inheritance?
  effects?: {
    initialize?: () => void | Promise<void>
    finalize?: () => void | Promise<void>
  } & Effects &
    ThisType<EffectContext<State, Props, Effects, Computed, ParentState, ParentEffects>>
  computed?: {
    [ComputedName in keyof Computed]: (
      state: State & ParentState & Computed,
      props: Props
    ) => Computed[ComputedName] | Promise<Computed[ComputedName]>
  }
}

declare module 'reaclette' {
  function provideState<State, Props, Effects, Computed, ParentState, ParentEffects>(
    stateSpec: StateSpec<State, Props, Effects, Computed, ParentState, ParentEffects>
  ): (component: React.Component<Props>) => React.Component<Props>

  function injectState<State, Props, Effects, Computed, ParentState, ParentEffects>(
    // FIXME: also accept class components
    component: React.FC<RenderParams<State, Props, Effects, Computed, ParentState, ParentEffects>>
  ): React.ElementType<Props>

  function withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
    stateSpec: StateSpec<State, Props, Effects, Computed, ParentState, ParentEffects>,
    component: React.FC<RenderParams<State, Props, Effects, Computed, ParentState, ParentEffects>>
  ): React.ElementType<Props>
}
