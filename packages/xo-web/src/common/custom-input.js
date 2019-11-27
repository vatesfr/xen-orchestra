import decorate from 'apply-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from 'reaclette'

const ENTER_KEY_CODE = 13
const ESCAPE_KEY_CODE = 27

const CustomInput = decorate([
  provideState({
    effects: {
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
    },
  }),
  injectState,
  ({ effects, ...props }) => (
    <input {...props} autoFocus onKeyDown={effects.onKeyDown} type='text' />
  ),
])

CustomInput.propTypes = {
  handler: PropTypes.func.isRequired,
}

export default CustomInput
