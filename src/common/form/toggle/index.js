import React from 'react'
import classNames from 'classnames'

import Component from '../../base-component'
import Icon from '../../icon'
import propTypes from '../../prop-types'

import styles from './index.css'

@propTypes({
  className: propTypes.string,
  defaultValue: propTypes.bool,
  onChange: propTypes.func,
  icon: propTypes.string,
  iconOn: propTypes.string,
  iconOff: propTypes.string,
  iconSize: propTypes.number,
  value: propTypes.bool
})
export default class Toggle extends Component {
  static defaultProps = {
    iconOn: 'toggle-on',
    iconOff: 'toggle-off',
    iconSize: 2
  }

  get value () {
    const { props } = this

    const { value } = props
    if (value != null) {
      return value
    }

    const { input } = this.refs
    if (input) {
      return input.checked
    }

    return props.defaultValue || false
  }

  set value (value) {
    if (
      process.env.NODE_ENV !== 'production' &&
      this.props.value != null
    ) {
      throw new Error('cannot set value of controlled Toggle')
    }

    this.refs.input.checked = Boolean(value)
  }

  _onChange = event => {
    if (this.props.value == null) {
      this.forceUpdate()
    }

    const { onChange } = this.props
    onChange && onChange(event.target.checked)
  }

  render () {
    const { props, value } = this

    return (
      <label
        className={classNames(
          props.disabled ? 'text-muted' : value ? 'text-success' : null,
          props.className
        )}
      >
        <Icon
          icon={props.icon || (value ? props.iconOn : props.iconOff)}
          size={props.iconSize}
        />
        <input
          checked={props.value}
          className={styles.checkbox}
          defaultChecked={props.defaultValue}
          disabled={props.disabled}
          onChange={this._onChange}
          ref='input'
          type='checkbox'
        />
      </label>
    )
  }
}
