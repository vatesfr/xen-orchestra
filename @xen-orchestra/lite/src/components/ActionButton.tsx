import React from 'react'
import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton'
import { withState } from 'reaclette'

interface ParentState {}

interface State {
  isLoading: boolean
}

// Omit the `onClick` props to rewrite its own one.
interface Props extends Omit<LoadingButtonProps, 'onClick'> {
  onClick: (data: Record<string, unknown>) => Promise<void>
  // to pass props with the following pattern: "data-something"
  [key: string]: unknown
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
      _onClick: function () {
        this.state.isLoading = true
        const data: Record<string, unknown> = {}
        Object.keys(this.props).forEach(key => {
          if (key.startsWith('data-')) {
            data[key.slice(5)] = this.props[key]
          }
        })
        return this.props.onClick(data).finally(() => (this.state.isLoading = false))
      },
    },
  },
  ({ children, color = 'secondary', effects, onClick, resetState, state, variant = 'contained', ...props }) => (
    <LoadingButton
      color={color}
      disabled={state.isLoading}
      fullWidth
      loading={state.isLoading}
      onClick={effects._onClick}
      variant={variant}
      {...props}
    >
      {children}
    </LoadingButton>
  )
)

export default ActionButton
