import map from 'lodash/map'

import {
  autobind
} from 'utils'

import AbstractInput from './abstract-input'

// ===================================================================

export default class XoAbstractInput extends AbstractInput {
  constructor (props) {
    super(props)
    this.state = {
      value:
        props.value ||
        (props.schema.type === 'array') ? [] : ''
    }
  }

  get value () {
    if (this.props.schema.type === 'array') {
      return map(this.state.value, (value) => value.value)
    }

    return this.state.value.value
  }

  set value (value) {
    this.setState({
      value
    })
  }

  @autobind
  _handleChange (value) {
    const { onChange } = this.props

    this.setState({
      value
    }, onChange && (() => { onChange(this.value) }))
  }
}
