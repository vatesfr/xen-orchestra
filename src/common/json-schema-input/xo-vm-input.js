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
  vms
} from 'selectors'
import {
  autobind,
  connectStore
} from 'utils'

import XoAbstractInput from './xo-abstract-input'
import { PrimitiveInputWrapper } from './helpers'

// ===================================================================

@connectStore(() => {
  const getVmsByContainer = createSelector(
    vms,
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
      vmsByContainer: getVmsByContainer(state, props)
    }
  }
}, { withRef: true })
export default class VmInput extends XoAbstractInput {
  @autobind
  _renderOption (option) {
    const { label, vm } = option

    if (!vm) {
      return (
        <div>
          <Icon icon={option.type} /> {label}
        </div>
      )
    }

    return (
      <div>
        <Icon icon={`vm-${vm.power_state.toLowerCase()}`} /> {label}
      </div>
    )
  }

  @autobind
  _renderValue (option) {
    return (
      <div>
        <Icon icon={`vm-${option.vm.power_state.toLowerCase()}`} /> {option.label}
      </div>
    )
  }

  render () {
    const { props } = this
    let options = []

    for (const containers of [
      {type: 'host', data: props.hosts},
      {type: 'pool', data: props.pools}
    ]) {
      forEach(containers.data, (label, value) => {
        options.push({
          value,
          label,
          disabled: true,
          type: containers.type
        })

        options = options.concat(
          map(props.vmsByContainer[value], vm => ({
            value: vm.id,
            label: `${vm.name_label || vm.id} (${label})`,
            vm
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
          placeholder={_('selectVms')}
          required={props.required}
          value={this.state.value}
          valueRenderer={this._renderValue}
        />
      </PrimitiveInputWrapper>
    )
  }
}
