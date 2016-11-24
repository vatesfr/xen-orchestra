import React from 'react'
import { omit } from 'lodash'

import Component from './base-component'
import getEventValue from './get-event-value'

const __DEV__ = process.env.NODE_ENV !== 'production'

// This decorator can be used on a controlled input component to make
// it able to automatically handled the uncontrolled mode.
export default () => ControlledInput => {
  class AutoControlledInput extends Component {
    constructor (props) {
      super()

      const controlled = this._controlled = props.value !== undefined
      if (!controlled) {
        this.state.value = props.defaultValue

        this._onChange = event => {
          let defaultPrevented = false

          const { onChange } = this.props
          if (onChange) {
            onChange(event)
            defaultPrevented = event && event.defaultPrevented
          }

          if (!defaultPrevented) {
            this.setState({ value: getEventValue(event) })
          }
        }
      } else if (__DEV__ && props.defaultValue !== undefined) {
        throw new Error(`${this.constructor.name}: controlled component should not have a default value`)
      }
    }

    get value () {
      return this._controlled
        ? this.props.value
        : this.state.value
    }

    set value (value) {
      if (__DEV__ && this._controlled) {
        throw new Error(`${this.constructor.name}: should not set value on controlled component`)
      }

      this.setState({ value })
    }

    render () {
      if (this._controlled) {
        return <ControlledInput {...this.props} />
      }

      return <ControlledInput
        {...omit(this.props, 'defaultValue')}
        onChange={this._onChange}
        value={this.state.value}
      />
    }
  }

  if (__DEV__) {
    AutoControlledInput.prototype.componentWillReceiveProps = function (newProps) {
      const { name } = this.constructor
      const controlled = this._controlled
      const newControlled = newProps.value !== undefined

      if (!controlled) {
        if (newControlled) {
          throw new Error(`${name}: uncontrolled component should not become controlled`)
        }
      } else if (!newControlled) {
        throw new Error(`${name}: controlled component should not become uncontrolled`)
      }

      if (newProps.defaultValue !== this.props.defaultValue) {
        throw new Error(`${name}: default value should not change`)
      }
    }
  }

  return AutoControlledInput
}
