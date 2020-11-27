import PropTypes from 'prop-types'
import React from 'react'
import classNames from 'classnames'
import uncontrollableInput from 'uncontrollable-input'

import Component from '../base-component'
import Icon from '../icon'

@uncontrollableInput()
export default class Toggle extends Component {
  static propTypes = {
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    icon: PropTypes.string,
    iconOn: PropTypes.string,
    iconOff: PropTypes.string,
    iconSize: PropTypes.number,
    value: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    iconOn: 'toggle-on',
    iconOff: 'toggle-off',
    iconSize: 2,
  }

  _toggle = () => {
    const { props } = this

    if (!props.disabled) {
      props.onChange(!props.value)
    }
  }

  render() {
    const { props } = this

    return (
      <Icon
        className={classNames(props.disabled ? 'text-muted' : props.value ? 'text-success' : null, props.className)}
        icon={props.icon || (props.value ? props.iconOn : props.iconOff)}
        onClick={this._toggle}
        size={props.iconSize}
      />
    )
  }
}
