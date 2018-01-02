import React from 'react'
import uncontrollableInput from 'uncontrollable-input'
import { isEmpty, map } from 'lodash'
import {
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledButtonDropdown,
} from 'reactstrap'

import Component from './base-component'
import propTypes from './prop-types-decorator'

@uncontrollableInput({
  defaultValue: '',
})
@propTypes({
  disabled: propTypes.bool,
  options: propTypes.oneOfType([
    propTypes.arrayOf(propTypes.string),
    propTypes.objectOf(propTypes.string),
  ]),
  onChange: propTypes.func.isRequired,
  value: propTypes.string.isRequired,
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
          <UncontrolledButtonDropdown>
            <DropdownToggle
              caret
              disabled={props.disabled}
            />
            <DropdownMenu>
              {map(options, option => (
                <DropdownItem key={option} onClick={() => this._setText(option)}>
                  {option}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </UncontrolledButtonDropdown>
        </div>
        {Input}
      </div>
    )
  }
}
