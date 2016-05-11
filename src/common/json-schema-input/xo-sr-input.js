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
  pools,
  userSrs
} from 'selectors'
import {
  autobind,
  connectStore,
  formatSize
} from 'utils'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@connectStore(() => {
  const getSrsByContainer = createSelector(
    userSrs,
    groupBy('$container')
  )

  const getHosts = createSelector(
    hosts,
    hosts => {
      const obj = {}

      forEach(hosts, host => {
        obj[host.id] = host.name_label || host.id
      })

      return obj
    }
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
      hosts: getHosts(state, props),
      pools: getPools(state, props),
      srsByContainer: getSrsByContainer(state, props)
    }
  }
}, { withRef: true })
export default class SrInput extends XoAbstractInput {
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

    for (const containers of [
      {type: 'pool', data: props.pools},
      {type: 'host', data: props.hosts}
    ]) {
      forEach(containers.data, (label, value) => {
        options.push({
          value,
          label,
          disabled: true,
          type: containers.type
        })

        options = options.concat(
          map(props.srsByContainer[value], sr => ({
            value: sr.id,
            label: `${sr.name_label || sr.id} (${formatSize(sr.size)})`,
            type: 'disk'
          }))
        )
      })
    }

    return (
      <PrimitiveInputWrapper {...props}>
        <Select
          multi={props.schema.type === 'array'}
          onChange={this._handleChange}
          optionRenderer={this._renderOption}
          options={options}
          placeholder={_('selectSrs')}
          required={props.required}
          value={this.state.value}
        />
      </PrimitiveInputWrapper>
    )
  }
}
