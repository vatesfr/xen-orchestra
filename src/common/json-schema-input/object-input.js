import _ from 'intl'
import React, { cloneElement } from 'react'
import { forEach, includes, map } from 'lodash'

import autoControlledInput from '../auto-controlled-input'
import Component from '../base-component'
import propTypes from '../prop-types'
import { EMPTY_OBJECT, propsEqual } from '../utils'

import GenericInput from './generic-input'
import {
  descriptionRender,
  forceDisplayOptionalAttr
} from './helpers'

// ===================================================================

@autoControlledInput
class ObjectItem extends Component {
  render () {
    return (
      <div className='pb-1'>
        {this.props.children}
      </div>
    )
  }
}

// ===================================================================

@propTypes({
  depth: propTypes.number,
  disabled: propTypes.bool,
  label: propTypes.any.isRequired,
  required: propTypes.bool,
  schema: propTypes.object.isRequired,
  uiSchema: propTypes.object
})
@autoControlledInput()
export default class ObjectInput extends Component {
  constructor (props) {
    super(props)
    this.state = {
      use: Boolean(props.required) || forceDisplayOptionalAttr(props),
      children: this._makeChildren(props)
    }
  }

  _handleOptionalChange = event => {
    const { checked } = event.target

    this.setState({
      use: checked
    })
  }

  _makeChildren (props) {
    const {
      depth = 0,
      schema,
      uiSchema = EMPTY_OBJECT,
      value = EMPTY_OBJECT
    } = props
    const obj = {}
    const { properties } = uiSchema

    forEach(schema.properties, (childSchema, key) => {
      obj[key] = (
        <ObjectItem key={key}>
          <GenericInput
            depth={depth + 2}
            disabled={props.disabled}
            label={childSchema.title || key}
            required={includes(schema.required, key)}
            schema={childSchema}
            uiSchema={properties && properties[key]}
            value={value[key]}
          />
        </ObjectItem>
      )
    })

    return obj
  }

  componentWillReceiveProps (props) {
    if (
      !propsEqual(
        this.props,
        props,
        [ 'depth', 'disabled', 'label', 'required', 'schema', 'uiSchema' ]
      )
    ) {
      this.setState({
        children: this._makeChildren(props)
      })
    }
  }

  render () {
    const { props, state } = this
    const { use } = state
    const depth = props.depth || 0

    return (
      <div style={{'paddingLeft': `${depth}em`}}>
        <legend>{props.label}</legend>
        {descriptionRender(props.schema.description)}
        <hr />
        {!props.required &&
          <div className='checkbox'>
            <label>
              <input
                checked={use}
                disabled={props.disabled}
                onChange={this._handleOptionalChange}
                type='checkbox'
              /> {_('fillOptionalInformations')}
            </label>
          </div>
        }
        {use &&
          <div className='card-block'>
            {map(state.children, (child, index) =>
              cloneElement(child, { ref: index })
            )}
          </div>
        }
      </div>
    )
  }
}
