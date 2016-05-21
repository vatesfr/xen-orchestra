import _ from 'messages'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'
import groupBy from 'lodash/groupBy'
import Icon from 'icon'
import keyBy from 'lodash/keyBy'
import keys from 'lodash/keys'
import map from 'lodash/map'
import React, { Component } from 'react'
import Select from 'react-select'
import sortBy from 'lodash/sortBy'
import { parse } from 'xo-remote-parser'

import {
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
  subscribeGroups,
  subscribeRemotes,
  subscribeUsers
} from 'xo'

// ===================================================================

@propTypes({
  autoFocus: propTypes.bool,
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
    const options = this._computeOptions(props)
    const { objects } = props

    this.setState({ options })

    if (!objects) {
      return
    }

    // Reset selected values if options are changed.
    this.setState({
      value: this._setValue(
        filter(this.value, value => value && objects[value.id])
      )
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

  _renderOption (option) {
    const { type } = option

    return (
      <div>
        {type && <Icon icon={type} />} {option.label}
      </div>
    )
  }
  // Unable to use @autobind here.
  // The inherited class cannot use autobind else.
  _renderOption = ::this._renderOption

  render () {
    const { props } = this

    return (
      <Select
        autofocus={props.autoFocus}
        disabled={props.disabled}
        multi={props.multi}
        onChange={this._handleChange}
        openOnFocus
        optionRenderer={this._renderOption}
        options={this.state.options}
        placeholder={props.placeholder || this._placeholder}
        required={props.required}
        value={this.state.value}
        valueRenderer={this._renderValue}
      />
    )
  }
}

// ===================================================================

@connectStore(() => {
  const getHosts = createGetObjectsOfType('host').filter(
    (state, props) => props.predicate
  )
  const getPools = createGetObjectsOfType('pool').pick(
    createSelector(
      getHosts,
      hosts => map(hosts, '$pool')
    )
  ).sort()
  const getHostsByPool = getHosts.groupBy('$pool')

  return (state, props) => ({
    hostsByPool: getHostsByPool(state, props),
    objects: getHosts(state, props),
    pools: getPools(state, props)
  })
}, { withRef: true })
export class SelectHost extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectHosts')
  }

  _computeOptions (props) {
    let newOptions = []

    forEach(props.pools, pool => {
      const poolId = pool.id

      newOptions.push({
        label: pool.name_label || poolId,
        disabled: true,
        type: 'pool'
      })

      newOptions.push.apply(newOptions,
        map(props.hostsByPool[poolId], host => {
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
  const getPools = createGetObjectsOfType('pool').filter(
    (state, props) => props.predicate
  )

  return (state, props) => ({
    objects: getPools(state, props)
  })
}, { withRef: true })
export class SelectPool extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectPools')
  }

  _computeOptions (props) {
    return map(
      props.objects,
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
        props.predicate ? filter(remotes, props.predicate) : remotes,
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

const userSrPredicate = sr => sr.content_type === 'user'

@connectStore(() => {
  const getSrs = createGetObjectsOfType('SR').filter(
    (_, { predicate }) => predicate || userSrPredicate
  )
  const getHosts = createGetObjectsOfType('host').pick(
    createSelector(
      getSrs,
      srs => map(srs, '$container')
    )
  ).sort()
  const getPools = createGetObjectsOfType('pool').pick(
    createSelector(
      getSrs,
      srs => map(srs, '$container')
    )
  ).sort()
  const getContainers = createSelector(
    getHosts,
    getPools,
    (hosts, pools) => hosts.concat(pools)
  )
  const getSrsByContainer = getSrs.groupBy('$container')

  return (state, props) => ({
    containers: getContainers(state, props),
    objects: getSrs(state, props),
    srsByContainer: getSrsByContainer(state, props)
  })
}, { withRef: true })
export class SelectSr extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectSrs')
  }

  _computeOptions (props) {
    let newOptions = []

    forEach(props.containers, container => {
      const containerId = container.id
      const containerLabel = container.name_label || containerId

      newOptions.push({
        label: containerLabel,
        disabled: true,
        type: container.type
      })

      newOptions.push.apply(newOptions,
        map(props.srsByContainer[containerId], sr => {
          const { id } = sr
          let label = `${sr.name_label || id}`

          if (sr.content_type === 'user') {
            label += ` (${formatSize(sr.size)})`
          }

          return {
            value: id,
            label,
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
  const getVms = createGetObjectsOfType('VM').filter(
    (state, props) => props.predicate
  )

  const getContainerIds = createSelector(
    getVms,
    vms => {
      // It makes sense to create a set instead of simply mapping
      // because there are much fewer containers than VMs.
      const set = {}
      forEach(vms, vm => {
        set[vm.$container] = true
      })
      return keys(set)
    }
  )
  const getHostContainers = createGetObjectsOfType('host').pick(getContainerIds).sort()
  const getPoolContainers = createGetObjectsOfType('pool').pick(getContainerIds).sort()

  const getVmsByContainer = getVms.sort().groupBy('$container')

  return (state, props) => ({
    hostContainers: getHostContainers(state, props),
    poolContainers: getPoolContainers(state, props),
    objects: getVms(state, props),
    vmsByContainer: getVmsByContainer(state, props)
  })
}, { withRef: true })
export class SelectVm extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectVms')
  }

  _computeOptions (props) {
    let newOptions = []

    const makeOptionsForContainer = container => {
      const containerId = container.id
      const containerLabel = container.name_label || containerId

      newOptions.push({
        label: containerLabel,
        disabled: true,
        type: container.type
      })

      newOptions.push.apply(newOptions,
        map(props.vmsByContainer[containerId], vm => {
          const { id } = vm
          return {
            value: id,
            label: `${vm.name_label || id} (${containerLabel})`,
            vm
          }
        })
      )
    }
    forEach(props.hostContainers, makeOptionsForContainer)
    forEach(props.poolContainers, makeOptionsForContainer)

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
  tags: createGetTags().filter(
    (state, props) => props.predicate
  ).sort()
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
      props.tags,
      tag => ({
        value: tag,
        label: tag,
        type: 'tags'
      })
    )
  }
}

// ===================================================================

@connectStore(() => {
  const getVmTemplates = createGetObjectsOfType('VM-template').filter(
    (state, props) => props.predicate
  )
  const getPools = createGetObjectsOfType('pool').pick(
    createSelector(
      getVmTemplates,
      vms => map(vms, '$container')
    )
  ).sort()
  const getVmsByPool = getVmTemplates.groupBy('$container')

  return (state, props) => ({
    containers: getPools(state, props),
    objects: getVmTemplates(state, props),
    vmTemplatesByContainer: getVmsByPool(state, props)
  })
}, { withRef: true })
export class SelectVmTemplate extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectVms')
  }

  _computeOptions (props) {
    let newOptions = []

    forEach(sortBy(props.containers, [ 'type', 'name_label' ]), container => {
      const containerId = container.id
      const containerLabel = container.name_label || containerId

      newOptions.push({
        label: containerLabel,
        disabled: true,
        type: container.type
      })

      newOptions.push.apply(newOptions,
        map(props.vmTemplatesByContainer[containerId], vm => {
          const { id } = vm
          return {
            value: id,
            label: `${vm.name_label || id} (${containerLabel})`,
            type: 'vm'
          }
        })
      )
    })

    return newOptions
  }
}

// ===================================================================

@connectStore(() => {
  const getNetworks = createGetObjectsOfType('network').filter(
    (state, props) => props.predicate
  )
  const getPools = createGetObjectsOfType('pool').pick(
    createSelector(
      getNetworks,
      networks => map(networks, '$pool')
    )
  ).sort()
  const getNetworksByPool = getNetworks.groupBy('$pool')

  return (state, props) => ({
    networksByPool: getNetworksByPool(state, props),
    objects: getNetworks(state, props),
    pools: getPools(state, props)
  })
}, { withRef: true })
export class SelectNetwork extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectNetworks')
  }

  _computeOptions (props) {
    let newOptions = []

    forEach(props.pools, pool => {
      const poolId = pool.id
      const poolLabel = pool.name_label || poolId

      newOptions.push({
        label: poolLabel,
        disabled: true,
        type: pool.type
      })

      newOptions.push.apply(newOptions,
        map(props.networksByPool[poolId], network => {
          const { id } = network
          return {
            value: id,
            label: `${network.name_label || id} (${poolLabel})`,
            type: 'network'
          }
        })
      )
    })

    return newOptions
  }
}

// ===================================================================

export class SelectEntity extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectEntities')
    this.state = {
      users: {},
      groups: {}
    }
  }

  componentWillMount () {
    const unsubscribeGroups = subscribeUsers(users => {
      users = keyBy(users, 'id')
      this.setState({
        users,
        options: this._computeOptions(this.props, { ...users, ...this.state.groups })
      })
    })

    const unsubscribeUsers = subscribeGroups(groups => {
      groups = keyBy(groups, 'id')
      this.setState({
        groups,
        options: this._computeOptions(this.props, { ...this.state.users, ...groups })
      })
    })

    this.componentWillUnmount = () => {
      unsubscribeGroups()
      unsubscribeUsers()
    }
  }

  _getEntities = () => {
    const { props: { predicate }, state } = this
    const entities = state.users.concat(state.groups)
    return predicate
      ? filter(entities, predicate)
      : entities
  }

  get value () {
    const { groups, users, value } = this.state

    if (this.props.multi) {
      return map(value, value => {
        const entity = value.value || value
        return groups[entity] || users[entity]
      })
    }

    const entity = value.value || value
    return groups[entity] || users[entity]
  }

  set value (value) {
    super.value = value
  }

  _computeOptions (props, entities = { ...this.state.users, ...this.state.groups }) {
    if (props.predicate) {
      entities = filter(entities, props.predicate)
    }

    return map(entities, entity => {
      if (entity.email) {
        return { label: entity.email, value: entity.id, type: 'group' }
      }

      return { label: entity.name, value: entity.id, type: 'user' }
    })
  }
}
