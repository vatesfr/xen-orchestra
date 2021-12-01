import React from 'react'
import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton'
import { withState } from 'reaclette'

interface ParentState {}

interface State {
  isLoading: boolean
}

interface Props extends LoadingButtonProps {
  onClick: (e: React.MouseEvent, data?: { [key: string]: unknown }) => Promise<void>
  // to pass props with the following patern: "data-something"
  [key: string]: unknown
}

interface ParentEffects {}

interface Effects {
  _onClick: React.MouseEventHandler<HTMLButtonElement>
}

interface Computed {
  data: { [key: string]: unknown }
}

const ActionButton = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({ isLoading: false }),
    effects: {
      _onClick: function (e) {
        this.state.isLoading = true
        return this.props.onClick(e, this.state.data).finally(() => (this.state.isLoading = false))
      },
    },
    computed: {
      data: (_, props) => {
        const _data: Record<string, unknown> = {}
        Object.keys(props).forEach(key => {
          if (key.startsWith('data-')) {
            _data[key.slice(5)] = props[key]
          }
        })
        return _data
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
