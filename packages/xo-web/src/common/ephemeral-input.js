import decorate from 'apply-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from 'reaclette'
import { linkState } from 'reaclette-utils'

const ENTER_KEY_CODE = 13
const ESCAPE_KEY_CODE = 27

const EphemeralInput = decorate([
  provideState({
    initialState: () => ({
      value: '',
    }),
    effects: {
      linkState,
      onKeyDown(_, event) {
        const { keyCode } = event

        if (keyCode !== ENTER_KEY_CODE && keyCode !== ESCAPE_KEY_CODE) {
          return
        }

        if (keyCode === ENTER_KEY_CODE) {
          const { value } = this.state
          if (value !== '') {
            this.props.onChange(value)
            this.resetState()
          }
        } else {
          this.props.closeEdition()
        }

        event.preventDefault()
      },
    },
  }),
  injectState,
  ({ effects, closeEdition, state, type }) => (
    <input
      autoFocus
      name='value'
      onBlur={closeEdition}
      onChange={effects.linkState}
      onKeyDown={effects.onKeyDown}
      type={type}
      value={state.value}
    />
  ),
])

EphemeralInput.propTypes = {
  closeEdition: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
}

export default EphemeralInput
