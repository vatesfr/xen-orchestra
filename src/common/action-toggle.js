import ActionButton from 'action-button'
import React, { Component } from 'react'
import { propTypes } from 'utils'

@propTypes({
  btnStyle: propTypes.string,
  disabled: propTypes.bool,
  form: propTypes.string,
  handler: propTypes.func.isRequired,
  size: propTypes.oneOf([
    'large',
    'small'
  ]),
  type: propTypes.string
})
export default class ActionToggle extends Component {
  render () {
    const { props } = this
    let className
    let toggle

    if (props.toggleOn) {
      className += ' btn-success'
      toggle = 'toggle-on'
    } else {
      toggle = 'toggle-off'
    }

    return (
      <ActionButton {...props} className={className} icon={toggle} />
    )
  }
}
