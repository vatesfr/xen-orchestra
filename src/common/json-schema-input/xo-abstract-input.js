import map from 'lodash/map'
import AbstractInput from './abstract-input'

// ===================================================================

export default class XoAbstractInput extends AbstractInput {
  get value () {
    const value = this.refs.input.value

    if (this.props.schema.type === 'array') {
      return map(value, object => object.id || object)
    }

    return value.id || value
  }

  set value (value) {
    this.refs.input.value = value
  }
}
