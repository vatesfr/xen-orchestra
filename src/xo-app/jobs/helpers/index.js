import find from 'lodash/find'
import map from 'lodash/map'
import React, { Component } from 'react'
import Select from 'react-select'
import { propTypes } from 'utils'

@propTypes({
  autoFocus: propTypes.bool,
  defaultValue: propTypes.any,
  disabled: propTypes.bool,
  multi: propTypes.bool,
  onChange: propTypes.func,
  options: propTypes.array,
  placeholder: propTypes.string,
  predicate: propTypes.func,
  required: propTypes.bool
})
export class SelectPlainObject extends Component {
  constructor (props) {
    super(props)
    this.state = {
      value: this._setValue(props.defaultValue, props)
    }
  }

  _setValue (value, props = this.props) {
    const reduceValue = value => value != null ? value[optionKey] || value : ''
    let { optionKey } = props
    optionKey || (optionKey = 'id')
    if (props.multi) {
      if (!Array.isArray(value)) {
        value = [value]
      }
      return map(value, reduceValue)
    }
    return reduceValue(value)
  }

  componentWillMount () {
    const { options } = this.props

    this.setState({
      options: this._computeOptions(options)
    })
  }

  componentWillReceiveProps (newProps) {
    const { options } = newProps

    this.setState({
      options: this._computeOptions(options)
    })
  }

  _computeOptions (options) {
    let { optionKey } = this.props
    optionKey || (optionKey = 'id')
    return map(options, option => ({
      value: option[optionKey] || option,
      label: option.label || option[optionKey] || option
    }))
  }

  get value () {
    let { optionKey } = this.props
    optionKey || (optionKey = 'id')
    const { value } = this.state
    const { options } = this.props
    const pickValue = ({value}) => find(options, option => option[optionKey] === value || option === value)

    if (this.props.multi) {
      return map(value, pickValue)
    }

    return pickValue(value)
  }

  set value (value) {
    this.setState({
      value: this._setValue(value)
    })
  }

  _handleChange = value => {
    const { onChange } = this.props

    this.setState({
      value: this._setValue(value)
    }, onChange && (() => { onChange(this.value) }))
  }

  _renderOption = option => <span>{option.label}</span>

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
        valueRenderer={this._renderOption} />
    )
  }
}
