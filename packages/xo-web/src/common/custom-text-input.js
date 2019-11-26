import Button from 'button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import Tooltip from 'tooltip'
import { injectState, provideState } from 'reaclette'
import { toggleState } from 'reaclette-utils'

const ENTER_KEY_CODE = 13
const ESCAPE_KEY_CODE = 27

const CustomTextInput = decorate([
  provideState({
    initialState: () => ({
      editing: false,
    }),
    effects: {
      closeEdition: () => ({ editing: false }),
      onKeyDown: (effects, event) => (_, props) => {
        const { keyCode, target } = event

        if (keyCode === ENTER_KEY_CODE) {
          if (target.value !== '') {
            props.handler(target.value)
            target.value = ''
          }
        } else if (keyCode === ESCAPE_KEY_CODE) {
          effects.closeEdition()
        } else {
          return
        }
        event.preventDefault()
      },
      toggleState,
    },
  }),
  injectState,
  ({ state, effects, tooltip, size }) =>
    state.editing ? (
      <input
        autoFocus
        onBlur={effects.closeEdition}
        onKeyDown={effects.onKeyDown}
        type='text'
      />
    ) : (
      <Tooltip content={tooltip}>
        <Button
          name='editing'
          onClick={effects.toggleState}
          size={size === undefined ? 'small' : size}
        >
          <Icon icon='edit' />
        </Button>
      </Tooltip>
    ),
])

CustomTextInput.propTypes = {
  handler: PropTypes.func.isRequired,
  size: PropTypes.string,
  tooltip: PropTypes.node,
}

export default CustomTextInput
