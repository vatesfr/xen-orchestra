import decorate from 'apply-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from 'reaclette'

const ENTER_KEY_CODE = 13
const ESCAPE_KEY_CODE = 27

const EphemeralInput = decorate([
  provideState({
    effects: {
      onKeyDown: (effects, event) => (_, props) => {
        const { keyCode, target } = event

        if (keyCode === ENTER_KEY_CODE) {
          if (target.value !== '') {
            props.onChange(target.value)
            if (props.oneTime) {
              props.closeEdition()
              return
            }
            target.value = ''
          }
        } else if (keyCode === ESCAPE_KEY_CODE) {
          props.closeEdition()
        } else {
          return
        }
        event.preventDefault()
      },
    },
  }),
  injectState,
  ({ effects, closeEdition, ...props }) => (
    <input
      {...props}
      autoFocus
      onBlur={closeEdition}
      onKeyDown={effects.onKeyDown}
    />
  ),
])

EphemeralInput.propTypes = {
  closeEdition: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  oneTime: PropTypes.bool,
}

EphemeralInput.defaultProps = {
  oneTime: false,
}

export default EphemeralInput
