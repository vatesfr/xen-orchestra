import React from 'react'
import { withState } from 'reaclette'
import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton'

interface ParentState {}

interface State {
  isLoading: boolean
}

interface Props extends LoadingButtonProps {
  onClick: (e: unknown) => Promise<void>
}

interface ParentEffects {}

interface Effects {
  _onClick: React.MouseEventHandler<HTMLButtonElement>
}

interface Computed {}

const ActionButton = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({ isLoading: false }),
    effects: {
      _onClick: function (e) {
        this.state.isLoading = true
        return this.props.onClick(e).finally(() => (this.state.isLoading = false))
      },
    },
  },
  ({ children, color = 'secondary', effects, onClick, resetState, state, variant = 'contained', ...props }) => (
    <LoadingButton
      color={color}
      disabled={state.isLoading}
      fullWidth
      loading={state.isLoading}
      variant={variant}
      onClick={effects._onClick}
      {...props}
    >
      {children}
    </LoadingButton>
  )
)

export default ActionButton
