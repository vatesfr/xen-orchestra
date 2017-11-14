import React from 'react'
import classNames from 'classnames'
import uncontrollableInput from 'uncontrollable-input'

import Component from '../base-component'
import Icon from '../icon'
import propTypes from '../prop-types-decorator'

@uncontrollableInput()
@propTypes({
  className: propTypes.string,
  onChange: propTypes.func,
  icon: propTypes.string,
  iconOn: propTypes.string,
  iconOff: propTypes.string,
  iconSize: propTypes.number,
  value: propTypes.bool,
})
export default class Toggle extends Component {
  static defaultProps = {
    iconOn: 'toggle-on',
    iconOff: 'toggle-off',
    iconSize: 2,
  }

  _toggle = () => {
    const { props } = this
    props.onChange(!props.value)
  }

  render () {
    const { props } = this

    return (
      <Icon
        className={classNames(
          props.disabled ? 'text-muted' : props.value ? 'text-success' : null,
          props.className
        )}
        icon={props.icon || (props.value ? props.iconOn : props.iconOff)}
        onClick={this._toggle}
        size={props.iconSize}
      />
    )
  }
}
