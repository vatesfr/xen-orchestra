import _ from 'messages'
import React, { Component, cloneElement } from 'react'
import map from 'lodash/map'
import filter from 'lodash/filter'

import {
  autobind,
  propsEqual,
  propTypes
} from 'utils'

import GenericInput from './generic-input'
import { descriptionRender } from './helpers'

// ===================================================================

class ArrayItem extends Component {
  get value () {
    return this.refs.input.value
  }

  set value (value) {
    this.refs.input.value = value
  }

  render () {
    const { props } = this

    return (
      <li className='list-group-item clearfix'>
        {cloneElement(props.children, {
          ref: 'input'
        })}
        <button className='btn btn-danger pull-xs-right' type='button' onClick={props.onDelete}>
          {_('remove')}
        </button>
      </li>
    )
  }
}

// ===================================================================

@propTypes({
  depth: propTypes.number,
  label: propTypes.any.isRequired,
  required: propTypes.bool,
  schema: propTypes.object.isRequired,
  uiSchema: propTypes.object,
  value: propTypes.object
})
export default class ArrayInput extends Component {
  constructor (props) {
    super(props)
    this.state = {
      use: props.required,
      children: this._makeChildren(props)
    }

    this._nextChildKey = 0
  }

  get value () {
    return map(this.refs, 'value')
  }

  @autobind
  _handleOptionalChange (event) {
    this.setState({
      use: event.target.checked
    })
  }

  @autobind
  _handleAdd () {
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
          label={items.title || _('item')}
          required
          schema={items}
          uiSchema={props.uiSchema.items}
        />
      </ArrayItem>
    )
  }

  _makeChildren ({ value, ...props }) {
    return map(value, value => {
      return (
        this._makeChild({
          ...props,
          value
        })
      )
    })
  }

  componentWillReceiveProps (props) {
    if (
      !propsEqual(
        this.props,
        props,
        ['depth', 'label', 'required', 'schema', 'uiSchema', 'value']
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
    const { schema } = props
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
            <button className='btn btn-primary pull-xs-right' type='button' onClick={this._handleAdd}>
              {_('add')}
            </button>
          </div>
        }
      </div>
    )
  }
}
