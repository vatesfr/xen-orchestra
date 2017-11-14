import React from 'react'
import uncontrollableInput from 'uncontrollable-input'
import { isEmpty, map } from 'lodash'
import { DropdownButton, MenuItem } from 'react-bootstrap-4/lib'

import Component from './base-component'
import propTypes from './prop-types-decorator'

@uncontrollableInput({
  defaultValue: ''
})
@propTypes({
  disabled: propTypes.bool,
  options: propTypes.oneOfType([
    propTypes.arrayOf(propTypes.string),
    propTypes.objectOf(propTypes.string)
  ]),
  onChange: propTypes.func.isRequired,
  value: propTypes.string.isRequired
})
export default class Combobox extends Component {
  _handleChange = event => {
    this.props.onChange(event.target.value)
  }

  _setText (value) {
    this.props.onChange(value)
  }

  render () {
    const { options, ...props } = this.props

    props.className = 'form-control'
    props.onChange = this._handleChange
    const Input = <input {...props} />

    if (isEmpty(options)) {
      return Input
    }

    return (
      <div className='input-group'>
        <div className='input-group-btn'>
          <DropdownButton
            bsStyle='secondary'
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
