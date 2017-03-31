import React from 'react'
import classNames from 'classnames'
import uncontrollableInput from 'uncontrollable-input'

import Component from '../../base-component'
import Icon from '../../icon'
import propTypes from '../../prop-types'

import styles from './index.css'

@uncontrollableInput()
@propTypes({
  className: propTypes.string,
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

  render () {
    const { props } = this

    return (
      <label
        className={classNames(
          props.disabled ? 'text-muted' : props.value ? 'text-success' : null,
          props.className
        )}
      >
        <Icon
          icon={props.icon || (props.value ? props.iconOn : props.iconOff)}
          size={props.iconSize}
        />
        <input
          checked={props.value || false}
          className={styles.checkbox}
          disabled={props.disabled}
          onChange={props.onChange}
          type='checkbox'
        />
      </label>
    )
  }
}
