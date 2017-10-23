import React from 'react'
import { debounce } from 'lodash'

import getEventValue from './get-event-value'

const DEFAULT_DELAY = ({ debounceTimeout = 250 }) => debounceTimeout

const debounceComponentDecorator = (delay = DEFAULT_DELAY) => Component =>
  class DebouncedComponent extends React.Component {
    constructor (props) {
      super()
      this.state = { value: props.value }

      this._notify = debounce(event => {
        this.props.onChange(event)
      }, typeof delay === 'function' ? delay(props) : delay)

      this._onChange = event => {
        this.setState({ value: getEventValue(event) })

        event.persist()
        this._notify(event)
      }

      this._wrappedInstance = null
      this._onRef = ref => {
        this._wrappedInstance = ref
      }
    }

    componentWillReceiveProps ({ value }) {
      if (value !== this.props.value) {
        this._notify.cancel()
        this.setState({ value })
      }
    }

    componentWillUnmount () {
      this._notify.flush()
    }

    getWrappedInstance () {
      return this._wrappedInstance
    }

    render () {
      const props = {
        ...this.props,
        onChange: this._onChange,
        ref: this._onRef,
        value: this.state.value
      }
      return <Component {...props} />
    }
  }
export { debounceComponentDecorator as default }

// common components
export const Input = debounceComponentDecorator()('input')
export const Textarea = debounceComponentDecorator()('textarea')
