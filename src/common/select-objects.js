import Icon from 'icon'
import React, { Component } from 'react'
import Select from 'react-select'
import _ from 'messages'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'
import groupBy from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
import { parse } from 'xo-remote-parser'

import {
  createCollectionWrapper,
  createGetObjectsOfType,
  createGetTags,
  createSelector
} from 'selectors'

import {
  autobind,
  connectStore,
  formatSize,
  propTypes
} from 'utils'

import {
  subscribeRemotes
} from 'xo'

// ===================================================================

const applyPredicate = (objects, predicate) =>
  predicate ? filter(objects, predicate) : objects

// Example of use:
// containers = pools array
// containersObjects = hosts array
// containerAttr = '$pool'
const containersFilter = (containers, containersObjects, containerAttr) => {
  const filteredContainers = {}
  containers = keyBy(containers, 'id')

  forEach(containersObjects, object => {
    const id = object[containerAttr]
    filteredContainers[id] = containers[id]
  })

  return filteredContainers
}

// ===================================================================

@propTypes({
  defaultValue: propTypes.any,
  disabled: propTypes.bool,
  multi: propTypes.bool,
  onChange: propTypes.func,
  placeholder: propTypes.string,
  predicate: propTypes.func,
  required: propTypes.bool
})
class GenericSelect extends Component {
  constructor (props) {
    super(props)
    this.state = {
      value: this._setValue(props.defaultValue || (props.multi ? [] : ''))
    }
  }

  // Supports id strings and objects.
  _setValue (value) {
    if (this.props.multi) {
      return map(value, object => object.id || object)
    }

    return value.id || value || ''
  }

  componentWillReceiveProps (props) {
    this.setState({
      options: this._computeOptions(props)
    })
  }

  componentWillMount () {
    this.setState({
      options: this._computeOptions(this.props)
    })
  }

  get value () {
    const { objects } = this.props
    const { value } = this.state

    if (this.props.multi) {
      return map(value, value => objects[value.value || value])
    }

    return objects[value.value || value]
  }

  set value (value) {
    this.setState({
      value: this._setValue(value)
    })
  }

  @autobind
  _handleChange (value) {
    const { onChange } = this.props

    this.setState({
      value
    }, onChange && (() => { onChange(this.value) }))
  }

  @autobind
  _renderOption (option) {
    const { type } = option

    return (
      <div>
        {type && <Icon icon={option.type} />} {option.label}
      </div>
    )
  }

  render () {
    const { props } = this

    return (
      <Select
        disabled={props.disabled}
        onChange={this._handleChange}
        optionRenderer={this._renderOption}
        options={this.state.options}
        placeholder={props.placeholder || this._placeholder}
        required={props.required}
        value={this.state.value}
        valueRenderer={this._renderValue}
        multi={props.multi}
      />
    )
  }
}

// ===================================================================

@connectStore(() => {
  const getHosts = createGetObjectsOfType('host').sort()
  const getPools = createGetObjectsOfType('pool').sort()
  const getObjects = createCollectionWrapper(
    createSelector(
      getHosts,
      hosts => keyBy(hosts, 'id')
    )
  )

  return (state, props) => ({
    objects: getObjects(state, props),
    pools: getPools(state, props)
  })
}, { withRef: true })
export class SelectHost extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectHosts')

    this.getFilteredHosts = createSelector(
      () => this.props.objects,
      hosts => applyPredicate(hosts, this.props.predicate)
    )

    this.getFilteredPools = createSelector(
      () => this.props.pools,
      pools => containersFilter(pools, this.getFilteredHosts(), '$pool')
    )
  }

  _computeOptions (props) {
    const pools = this.getFilteredPools()
    const hostsByPool = groupBy(this.getFilteredHosts(), '$pool')
    let newOptions = []

    forEach(pools, (pool, poolId) => {
      newOptions.push({
        label: pool.name_label || poolId,
        disabled: true,
        type: 'pool'
      })

      newOptions.push.apply(newOptions,
        map(hostsByPool[poolId], host => {
          const { id } = host
          return {
            value: id,
            label: host.name_label || id,
            type: 'host'
          }
        })
      )
    })

    return newOptions
  }
}

// ===================================================================

@connectStore(() => {
  const getPools = createGetObjectsOfType('pool').sort()
  const getObjects = createCollectionWrapper(
    createSelector(
      getPools,
      pools => keyBy(pools, 'id')
    )
  )

  return (state, props) => ({
    objects: getObjects(state, props)
  })
}, { withRef: true })
export class SelectPool extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectPools')
  }

  _computeOptions (props) {
    return map(
      applyPredicate(props.objects, props.predicate),
      pool => {
        const { id } = pool
        return {
          value: id,
          label: pool.name_label || id,
          type: 'pool'
        }
      }
    )
  }
}

// ===================================================================

export class SelectRemote extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectRemotes')
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeRemotes(remotes => {
      this.setState({
        remotes: keyBy(remotes, 'id'),
        options: this._computeOptions(this.props, remotes)
      })
    })
  }

  get value () {
    const { remotes, value } = this.state

    if (this.props.multi) {
      return map(value, value => remotes[value.value || value])
    }

    return remotes[value.value || value]
  }

  set value (value) {
    super.value = value
  }

  _computeOptions (props, remotes = this.state.remotes) {
    const remotesByGroup = groupBy(
      map(
        applyPredicate(remotes, props.predicate),
        parse
      ), 'type'
    )
    let newOptions = []

    forEach(remotesByGroup, (remotes, label) => {
      newOptions.push({
        label,
        disabled: true
      })

      newOptions.push.apply(newOptions,
        map(sortBy(remotes, 'name'), remote => ({
          value: remote.id,
          label: remote.name
        }))
      )
    })

    return newOptions
  }
}

// ===================================================================

@connectStore(() => {
  const getHosts = createGetObjectsOfType('host').sort()
  const getPools = createGetObjectsOfType('pool').sort()
  const getSrs = createGetObjectsOfType('SR').filter([
    sr => sr.content_type === 'user'
  ])
  const getObjects = createCollectionWrapper(
    createSelector(
      getSrs,
      srs => keyBy(srs, 'id')
    )
  )

  return (state, props) => ({
    hosts: getHosts(state, props),
    objects: getObjects(state, props),
    pools: getPools(state, props)
  })
}, { withRef: true })
export class SelectSr extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectSrs')

    this.getFilteredSrs = createSelector(
      () => this.props.objects,
      srs => applyPredicate(srs, this.props.predicate)
    )

    this.getFilteredContainers = createSelector(
      () => this.props.hosts,
      () => this.props.pools,
      (hosts, pools) => containersFilter(hosts.concat(pools), this.getFilteredSrs(), '$container')
    )
  }

  _computeOptions (props) {
    const containers = this.getFilteredContainers()
    const srsByContainer = groupBy(this.getFilteredSrs(), '$container')
    let newOptions = []

    forEach(containers, container => {
      const containerId = container.id
      const containerLabel = container.name_label || containerId

      newOptions.push({
        label: containerLabel,
        disabled: true,
        type: container.type
      })

      newOptions.push.apply(newOptions,
        map(srsByContainer[containerId], sr => {
          const { id } = sr
          return {
            value: id,
            label: `${sr.name_label || id} (${formatSize(sr.size)})`,
            type: 'disk'
          }
        })
      )
    })

    return newOptions
  }
}

// ===================================================================

@connectStore(() => {
  const getHosts = createGetObjectsOfType('host').sort()
  const getPools = createGetObjectsOfType('pool').sort()
  const getVms = createGetObjectsOfType('VM').sort()
  const getObjects = createCollectionWrapper(
    createSelector(
      getVms,
      vms => keyBy(vms, 'id')
    )
  )

  return (state, props) => ({
    hosts: getHosts(state, props),
    objects: getObjects(state, props),
    pools: getPools(state, props)
  })
}, { withRef: true })
export class SelectVm extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectVms')

    this.getFilteredVms = createSelector(
      () => this.props.objects,
      vms => applyPredicate(vms, this.props.predicate)
    )

    this.getFilteredContainers = createSelector(
      () => this.props.hosts,
      () => this.props.pools,
      (hosts, pools) => containersFilter(hosts.concat(pools), this.getFilteredVms(), '$container')
    )
  }

  _computeOptions (props) {
    const containers = this.getFilteredContainers()
    const vmsByContainer = groupBy(this.getFilteredVms(), '$container')
    let newOptions = []

    forEach(sortBy(containers, [ 'type', 'name_label' ]), container => {
      const containerId = container.id
      const containerLabel = container.name_label || containerId

      newOptions.push({
        label: containerLabel,
        disabled: true,
        type: container.type
      })

      newOptions.push.apply(newOptions,
        map(vmsByContainer[containerId], vm => {
          const { id } = vm
          return {
            value: id,
            label: `${vm.name_label || id} (${containerLabel})`,
            vm
          }
        })
      )
    })

    return newOptions
  }

  @autobind
  _renderOption (option) {
    const { vm } = option

    if (!vm) {
      return super._renderOption(option)
    }

    return (
      <div>
        <Icon icon={`vm-${vm.power_state.toLowerCase()}`} /> {option.label}
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
}

// ===================================================================

@connectStore({
  tags: createGetTags()
}, { withRef: true })
export class SelectTag extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectTags')
  }

  get value () {
    const { value } = this.state

    if (this.props.multi) {
      return map(value, value => value.value || value)
    }

    return value.value || value
  }

  set value (value) {
    super.value = value
  }

  _computeOptions (props) {
    return map(
      applyPredicate(props.tags, props.predicate),
      tag => ({
        value: tag,
        label: tag,
        type: 'tags'
      }))
  }
}
