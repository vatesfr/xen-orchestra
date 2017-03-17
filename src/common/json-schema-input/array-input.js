import React from 'react'
import uncontrollableInput from 'uncontrollable-input'
import { filter, map } from 'lodash'

import _ from '../intl'
import Component from '../base-component'
import propTypes from '../prop-types'
import { EMPTY_ARRAY } from '../utils'

import GenericInput from './generic-input'
import {
  descriptionRender,
  forceDisplayOptionalAttr
} from './helpers'

@propTypes({
  depth: propTypes.number,
  disabled: propTypes.bool,
  label: propTypes.any.isRequired,
  required: propTypes.bool,
  schema: propTypes.object.isRequired,
  uiSchema: propTypes.object
})
@uncontrollableInput()
export default class ObjectInput extends Component {
  state = {
    use: this.props.required || forceDisplayOptionalAttr(this.props)
  }

  _onAddItem = () => {
    const { props } = this
    props.onChange((props.value || EMPTY_ARRAY).concat(undefined))
  }

  _onChangeItem = (value, name) => {
    const key = Number(name)

    const { props } = this
    const newValue = (props.value || EMPTY_ARRAY).slice()
    newValue[key] = value
    props.onChange(newValue)
  }

  _onRemoveItem = key => {
    const { props } = this
    props.onChange(filter(props.value, (_, i) => i !== key))
  }

  render () {
    const {
      props: {
        depth = 0,
        disabled,
        label,
        required,
        schema,
        uiSchema,
        value = EMPTY_ARRAY
      },
      state: { use }
    } = this

    const childDepth = depth + 2
    const itemSchema = schema.items
    const itemUiSchema = uiSchema && uiSchema.items

    const itemLabel = itemSchema.title || _('item')

    return (
      <div style={{'paddingLeft': `${depth}em`}}>
        <legend>{label}</legend>
        {descriptionRender(schema.description)}
        <hr />
        {!required && <div className='checkbox'>
          <label>
            <input
              checked={use}
              disabled={disabled}
              onChange={this.linkState('use')}
              type='checkbox'
            /> {_('fillOptionalInformations')}
          </label>
        </div>}
        {use && <div className='card-block'>
          <ul style={{'paddingLeft': 0}} >
            {map(value, (value, key) =>
              <li className='list-group-item clearfix' key={key}>
                <GenericInput
                  depth={childDepth}
                  disabled={disabled}
                  label={itemLabel}
                  name={key}
                  onChange={this._onChangeItem}
                  required
                  schema={itemSchema}
                  uiSchema={itemUiSchema}
                  value={value}
                />
                <button
                  className='btn btn-danger pull-right'
                  disabled={disabled}
                  name={key}
                  onClick={() => this._onRemoveItem(key)}
                  type='button'
                >
                  {_('remove')}
                </button>
              </li>
            )}
          </ul>
          <button
            className='btn btn-primary pull-right mt-1 mr-1'
            disabled={disabled}
            onClick={this._onAddItem}
            type='button'
          >
            {_('add')}
          </button>
        </div>}
      </div>
    )
  }
}
