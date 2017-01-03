import map from 'lodash/map'
import React from 'react'
import size from 'lodash/size'

import Component from '../base-component'
import propTypes from '../prop-types'
import { ensureArray } from '../utils'
import {
  DropdownButton,
  MenuItem
} from 'react-bootstrap-4/lib'

import styles from './index.css'

@propTypes({
  defaultValue: propTypes.any,
  disabled: propTypes.bool,
  max: propTypes.number,
  min: propTypes.number,
  options: propTypes.oneOfType([
    propTypes.arrayOf(propTypes.string),
    propTypes.number,
    propTypes.objectOf(propTypes.string),
    propTypes.string
  ]),
  onChange: propTypes.func,
  placeholder: propTypes.string,
  required: propTypes.bool,
  step: propTypes.any,
  type: propTypes.string,
  value: propTypes.any
})
export default class Combobox extends Component {
  static defaultProps = {
    type: 'text'
  }

  get value () {
    return this.refs.input.value
  }

  set value (value) {
    this.refs.input.value = value
  }

  _handleChange = event => {
    const { onChange } = this.props

    if (onChange) {
      onChange(event.target.value)
    }
  }

  _setText (value) {
    this.refs.input.value = value
  }

  render () {
    const { props } = this
    const options = ensureArray(props.options)

    const Input = (
      <input
        className='form-control'
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        max={props.max}
        min={props.min}
        options={options}
        onChange={this._handleChange}
        placeholder={props.placeholder}
        ref='input'
        required={props.required}
        step={props.step}
        type={props.type}
        value={props.value}
      />
    )

    if (!size(options)) {
      return Input
    }

    return (
      <div className='input-group'>
        <div className='input-group-btn'>
          <DropdownButton
            bsStyle='secondary'
            className={styles.button}
            disabled={props.disabled}
            id='selectInput'
            title=''
          >
            {map(options, option => (
              <MenuItem key={option} onClick={() => this._setText(option)}>
                {option}
              </MenuItem>
            ))}
          </DropdownButton>
        </div>
        {Input}
      </div>
    )
  }
}
