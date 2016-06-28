import _ from 'intl'
import React, { Component, cloneElement } from 'react'
import map from 'lodash/map'
import filter from 'lodash/filter'

import {
  propsEqual,
  propTypes
} from 'utils'

import GenericInput from './generic-input'

import {
  descriptionRender,
  forceDisplayOptionalAttr
} from './helpers'

// ===================================================================

class ArrayItem extends Component {
  get value () {
    return this.refs.input.value
  }

  set value (value) {
    this.refs.input.value = value
  }

  render () {
    const { children } = this.props

    return (
      <li className='list-group-item clearfix'>
        {cloneElement(children, {
          ref: 'input'
        })}
        <button disabled={children.props.disabled} className='btn btn-danger pull-xs-right' type='button' onClick={this.props.onDelete}>
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
  uiSchema: propTypes.object,
  defaultValue: propTypes.array
})
export default class ArrayInput extends Component {
  constructor (props) {
    super(props)
    this.state = {
      use: props.required || forceDisplayOptionalAttr(props),
      children: this._makeChildren(props)
    }
    this._nextChildKey = 0
  }

  get value () {
    if (this.state.use) {
      return map(this.refs, 'value')
    }
  }

  set value (value = []) {
    this.setState({
      children: this._makeChildren({ ...this.props, value })
    })
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

  _makeChild (props) {
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
          defaultValue={props.defaultValue}
        />
      </ArrayItem>
    )
  }

  _makeChildren ({ defaultValue, ...props }) {
    return map(defaultValue, defaultValue => {
      return (
        this._makeChild({
          ...props,
          defaultValue
        })
      )
    })
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
            <button disabled={disabled} className='btn btn-primary pull-xs-right m-t-1 m-r-1' type='button' onClick={this._handleAdd}>
              {_('add')}
            </button>
          </div>
        }
      </div>
    )
  }
}
