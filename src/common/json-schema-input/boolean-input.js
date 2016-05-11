import React from 'react'
import Icon from 'icon'
import { autobind } from 'utils'

import AbstractInput from './abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

export default class BooleanInput extends AbstractInput {
  constructor (props) {
    super(props)
    this.state = {
      checked: Boolean(props.value || props.schema.default) || false
    }
  }

  get value () {
    return this.refs.input.checked
  }

  set value (checked) {
    checked = Boolean(checked)

    this.setState({
      checked
    }, () => { this.refs.input.checked = Boolean(checked) })
  }

  @autobind
  _onChange (checked) {
    const { onChange } = this.props

    this.setState({
      checked
    })

    if (onChange) {
      onChange(checked)
    }
  }

  render () {
    const { props } = this
    const {
      checked
    } = this.state

    return (
      <PrimitiveInputWrapper {...props}>
        <div className='checkbox form-control'>
          <label>
            <Icon icon={`toggle-${!checked ? 'off' : 'on'}`} size={2} />
            <input
              defaultChecked={checked || props.schema.default || false}
              onChange={event => { this._onChange(event.target.checked) }}
              ref='input'
              style={{ visibility: 'hidden' }}
              type='checkbox'
            />
          </label>
        </div>
      </PrimitiveInputWrapper>
    )
  }
}
