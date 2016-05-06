import _ from 'messages'
import React from 'react'
import Select from 'react-select'
import map from 'lodash/map'

import Icon from 'icon'
import {
  create as createSelector,
  pools
} from 'selectors'
import {
  autobind,
  connectStore
} from 'utils'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@connectStore(() => {
  const getPools = createSelector(
    pools,
    pools =>
      map(pools, pool => ({
        value: pool.id,
        label: pool.name_label || pool.id
      }))
  )

  return (state, props) => {
    return {
      pools: getPools(state, props)
    }
  }
}, { withRef: true })
export default class PoolInput extends XoAbstractInput {
  @autobind
  _renderOption (option) {
    return (
      <div>
        <Icon icon='pool' /> {option.label}
      </div>
    )
  }

  render () {
    const { props } = this

    return (
      <PrimitiveInputWrapper {...props}>
        <Select
          multi={props.schema.type === 'array'}
          onChange={this._handleChange}
          optionRenderer={this._renderOption}
          options={props.pools}
          placeholder={_('selectPools')}
          required={props.required}
          value={this.state.value}
        />
      </PrimitiveInputWrapper>
    )
  }
}
