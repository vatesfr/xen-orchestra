import React from 'react'
import uncontrollableInput from 'uncontrollable-input'
import { createSelector } from 'reselect'
import { keyBy, map } from 'lodash'

import _ from '../intl'
import Component from '../base-component'
import propTypes from '../prop-types'
import { EMPTY_OBJECT } from '../utils'

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

  _onChildChange = (value, key) => {
    this.props.onChange({
      ...this.props.value,
      [key]: value
    })
  }

  _getRequiredProps = createSelector(
    () => this.props.schema.required,
    required => required
      ? keyBy(required)
      : EMPTY_OBJECT
  )

  render () {
    const {
      props: {
        depth = 0,
        disabled,
        label,
        required,
        schema,
        uiSchema,
        value = EMPTY_OBJECT
      },
      state: { use }
    } = this

    const childDepth = depth + 2
    const properties = uiSchema && uiSchema.properties || EMPTY_OBJECT
    const requiredProps = this._getRequiredProps()

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
          {map(schema.properties, (childSchema, key) =>
            <div className='pb-1' key={key}>
              <GenericInput
                depth={childDepth}
                disabled={disabled}
                label={childSchema.title || key}
                name={key}
                onChange={this._onChildChange}
                required={Boolean(requiredProps[key])}
                schema={childSchema}
                uiSchema={properties[key]}
                value={value[key]}
              />
            </div>
          )}
        </div>}
      </div>
    )
  }
}
