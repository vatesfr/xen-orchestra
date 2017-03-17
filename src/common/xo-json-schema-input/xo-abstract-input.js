import map from 'lodash/map'
import { PureComponent } from 'react'

// ===================================================================

export default class XoAbstractInput extends PureComponent {
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
