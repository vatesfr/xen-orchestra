import React from 'react'
import PropTypes from 'prop-types'
import uncontrollableInput from 'uncontrollable-input'
import { isEmpty, map } from 'lodash'
import { DropdownButton, MenuItem } from 'react-bootstrap-4/lib'

import Component from './base-component'

@uncontrollableInput({
  defaultValue: '',
})
export default class Combobox extends Component {
  static propTypes = {
    disabled: PropTypes.bool,
    options: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.objectOf(PropTypes.string)]),
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    multiline: PropTypes.bool,
  }

  _handleChange = event => {
    this.props.onChange(event.target.value)
  }

  _setText(value) {
    this.props.onChange(value)
  }

  render() {
    const { options, multiline = false, ...props } = this.props

    props.className = 'form-control'
    props.onChange = this._handleChange
    const Input = multiline ? <textarea {...props} /> : <input {...props} />

    if (isEmpty(options)) {
      return Input
    }

    return (
      <div className='input-group'>
        <div className='input-group-btn'>
          <DropdownButton bsStyle='secondary' disabled={props.disabled} id='selectInput' title=''>
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
