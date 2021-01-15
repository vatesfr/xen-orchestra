import map from 'lodash/map'
import { PureComponent } from 'react'

import getEventValue from '../get-event-value'

// ===================================================================

const getId = value => (value != null && value.id) || value

export default class XoAbstractInput extends PureComponent {
  _onChange = event => {
    const value = getEventValue(event)
    const { props } = this

    return props.onChange(props.schema.type === 'array' ? map(value, getId) : getId(value))
  }
}
