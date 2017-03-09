import React, { cloneElement } from 'react'
import map from 'lodash/map'
import filter from 'lodash/filter'

import _ from '../intl'
import autoControlledInput from '../auto-controlled-input'
import Component from '../base-component'
import propTypes from '../prop-types'
import { propsEqual } from '../utils'

import GenericInput from './generic-input'
import {
  descriptionRender,
  forceDisplayOptionalAttr
} from './helpers'

// ===================================================================

@autoControlledInput()
class ArrayItem extends Component {
  render () {
    const { children, onDelete } = this.props

    return (
      <li className='list-group-item clearfix'>
        {children}
        <button
          className='btn btn-danger pull-right'
          disabled={children.props.disabled}
          onClick={onDelete}
          type='button'
        >
          {_('remove')}
        </button>
      </li>
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
export default class ArrayInput extends Component {
  constructor (props) {
    super(props)

    this._nextChildKey = 0

    this.state = {
      use: props.required || forceDisplayOptionalAttr(props),
      children: this._makeChildren(props)
    }
  }

  _handleOptionalChange = event => {
    this.setState({
      use: event.target.checked
    })
  }

  _handleAdd = () => {
    const { children } = this.state
    this.setState({
      children: children.concat(this._makeChild(this.props))
    })
  }

  _remove (key) {
    this.setState({
      children: filter(this.state.children, child => child.key !== key)
    })
  }

  _makeChild (props, value) {
    const key = String(this._nextChildKey++)
    const {
      schema: {
        items
      }
    } = props

    return (
      <ArrayItem key={key} onDelete={() => { this._remove(key) }}>
        <GenericInput
          depth={props.depth}
          disabled={props.disabled}
          label={items.title || _('item')}
          required
          schema={items}
          uiSchema={props.uiSchema.items}
          value={value}
        />
      </ArrayItem>
    )
  }

  _makeChildren (props) {
    return map(props.value, value =>
      this._makeChild(props, value)
    )
  }

  componentWillReceiveProps (props) {
    if (
      !propsEqual(
        this.props,
        props,
        [ 'depth', 'disabled', 'label', 'required', 'schema', 'uiSchema', 'value' ]
      )
    ) {
      this.setState({
        children: this._makeChildren(props)
      })
    }
  }

  render () {
    const {
      props,
      state
    } = this
    const {
      disabled,
      schema
    } = props
    const { use } = state
    const depth = props.depth || 0

    return (
      <div style={{'paddingLeft': `${depth}em`}}>
        <legend>{props.label}</legend>
        {descriptionRender(schema.description)}
        <hr />
        {!props.required &&
          <div className='checkbox'>
            <label>
              <input
                checked={use}
                disabled={disabled}
                onChange={this._handleOptionalChange}
                type='checkbox'
              /> {_('fillOptionalInformations')}
            </label>
          </div>
        }
        {use &&
          <div className={'card-block'}>
            <ul style={{'paddingLeft': 0}} >
              {map(this.state.children, (child, index) =>
                cloneElement(child, { ref: index })
              )}
            </ul>
            <button disabled={disabled} className='btn btn-primary pull-right mt-1 mr-1' type='button' onClick={this._handleAdd}>
              {_('add')}
            </button>
          </div>
        }
      </div>
    )
  }
}
