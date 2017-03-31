import uncontrollableInput from 'uncontrollable-input'
import Component from 'base-component'
import find from 'lodash/find'
import map from 'lodash/map'
import React from 'react'

import propTypes from '../prop-types'

import Select from './select'

@propTypes({
  autoFocus: propTypes.bool,
  disabled: propTypes.bool,
  optionRenderer: propTypes.func,
  multi: propTypes.bool,
  onChange: propTypes.func,
  options: propTypes.array,
  placeholder: propTypes.string,
  predicate: propTypes.func,
  required: propTypes.bool,
  value: propTypes.any
})
@uncontrollableInput()
export default class SelectPlainObject extends Component {
  componentDidMount () {
    const { options, value } = this.props

    this.setState({
      options: this._computeOptions(options),
      value: this._computeValue(value, this.props)
    })
  }

  componentWillReceiveProps (newProps) {
    if (newProps !== this.props) {
      this.setState({
        options: this._computeOptions(newProps.options),
        value: this._computeValue(newProps.value, newProps)
      })
    }
  }

  _computeValue (value, props = this.props) {
    let { optionKey } = props
    optionKey || (optionKey = 'id')
    const reduceValue = value => value != null ? (value[optionKey] || value) : ''
    if (props.multi) {
      if (!Array.isArray(value)) {
        value = [value]
      }
      return map(value, reduceValue)
    }

    return reduceValue(value)
  }

  _computeOptions (options) {
    const { optionKey = 'id' } = this.props
    const { optionRenderer = o => o.label || o[optionKey] || o } = this.props
    return map(options, option => ({
      value: option[optionKey] || option,
      label: optionRenderer(option)
    }))
  }

  _getObject (value) {
    if (value == null) {
      return undefined
    }

    const { optionKey = 'id', options } = this.props

    const pickValue = value => {
      value = value.value || value
      return find(options, option => option[optionKey] === value || option === value)
    }

    if (this.props.multi) {
      return map(value, pickValue)
    }

    return pickValue(value)
  }

  _handleChange = value => {
    const { onChange } = this.props

    if (onChange) {
      onChange(this._getObject(value))
    }
  }

  _renderOption = option => option.label

  render () {
    const { props, state } = this

    return (
      <Select
        autofocus={props.autoFocus}
        disabled={props.disabled}
        multi={props.multi}
        onChange={this._handleChange}
        openOnFocus
        optionRenderer={this._renderOption}
        options={state.options}
        placeholder={props.placeholder}
        required={props.required}
        value={state.value}
        valueRenderer={this._renderOption}
      />
    )
  }
}
