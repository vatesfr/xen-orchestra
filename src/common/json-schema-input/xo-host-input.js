import _ from 'messages'
import React from 'react'
import Select from 'react-select'
import forEach from 'lodash/forEach'
import groupBy from 'lodash/fp/groupBy'
import map from 'lodash/map'

import Icon from 'icon'
import {
  create as createSelector,
  hosts,
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
  const getHostsByContainer = createSelector(
    hosts,
    groupBy('$poolId')
  )

  const getPools = createSelector(
    pools,
    pools => {
      const obj = {}

      forEach(pools, pool => {
        obj[pool.id] = pool.name_label || pool.id
      })

      return obj
    }
  )

  return (state, props) => {
    return {
      pools: getPools(state, props),
      hostsByContainer: getHostsByContainer(state, props)
    }
  }
}, { withRef: true })
export default class HostInput extends XoAbstractInput {
  @autobind
  _renderOption (option) {
    return (
      <div>
        <Icon icon={option.type} /> {option.label}
      </div>
    )
  }

  render () {
    const { props } = this
    let options = []

    forEach(props.pools, (label, value) => {
      options.push({
        value,
        label,
        disabled: true,
        type: 'pool'
      })

      options = options.concat(
        map(props.hostsByContainer[value], host => ({
          value: host.id,
          label: host.name_label || host.id,
          type: 'host'
        }))
      )
    })

    return (
      <PrimitiveInputWrapper {...props}>
        <Select
          multi={props.schema.type === 'array'}
          onChange={this._handleChange}
          optionRenderer={this._renderOption}
          options={options}
          placeholder={_('selectHosts')}
          required={props.required}
          value={this.state.value}
        />
      </PrimitiveInputWrapper>
    )
  }
}
