import { Component } from 'react'
import {
  propTypes
} from 'utils'

// ===================================================================

@propTypes({
  label: propTypes.string.isRequired,
  onChange: propTypes.func,
  placeholder: propTypes.string,
  required: propTypes.bool,
  schema: propTypes.object.isRequired,
  uiSchema: propTypes.object,
  value: propTypes.any
})
export default class AbstractInput extends Component {
  set value (value) {
    this.refs.input.value = String(value)
  }

  get value () {
    const { value } = this.refs.input
    return !value ? undefined : value
  }
}
