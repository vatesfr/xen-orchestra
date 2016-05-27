import Component from 'base-component'
import React from 'react'
import Select from 'react-select'
import _ from 'messages'
import filter from 'lodash/filter'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import groupBy from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import keys from 'lodash/keys'
import map from 'lodash/map'
import renderXoItem from 'render-xo-item'
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
  required: propTypes.bool,
  xoObjects: propTypes.object.isRequired
})
export class GenericSelect extends Component {
  constructor (props) {
    super(props)
    this.state = {
      value: this._setValue(props.defaultValue || (props.multi ? [] : ''))
    }
  }

  // Supports id strings and objects.
  _setValue (value, props = this.props) {
    if (props.multi) {
      return map(value, object => object.id || object)
    }

    return value.id || value
  }

  componentWillReceiveProps (props) {
    const options = this._computeOptions(props)
    const { xoObjects } = props

    this.setState({ options })

    if (!xoObjects) {
      return
    }

    // Reset selected values if options are changed.
    const value = this.value

    // For array.
    if (props.multi) {
      this.setState({
        value: this._setValue(
          filter(value, value => value && xoObjects[value.id]),
          props
        )
      })

      return
    }

    // For one unique selected value.
    this.setState({
      value: this._setValue(
        find(xoObjects, (_, id) => id === value.id) || '',
        props
      )
    })
  }

  componentWillMount () {
    this.setState({
      options: this._computeOptions(this.props)
    })
  }

  get value () {
    const { xoObjects } = this.props
    const { value } = this.state

    if (this.props.multi) {
      return map(value, value => xoObjects[value.value || value])
    }

    return xoObjects[value.value || value] || ''
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
      value: value || ''
    }, onChange && (() => { onChange(this.value) }))
  }

  _renderOption = option => {
    const { xoItem } = option
    return !xoItem ? option.label : renderXoItem(xoItem)
  }

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
        valueRenderer={this._renderOption}
      />
    )
  }
}

// ===================================================================
// XO objects.
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
  const getHostsByPool = getHosts.sort().groupBy('$pool')

  return (state, props) => ({
    hostsByPool: getHostsByPool(state, props),
    xoObjects: getHosts(state, props),
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
      newOptions.push({
        disabled: true,
        xoItem: pool
      })

      newOptions.push.apply(newOptions,
        map(props.hostsByPool[pool.id], host => ({
          value: host.id,
          label: `${host.name_label} ${pool.name_label}`,
          xoItem: host
        }))
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
    xoObjects: getPools(state, props)
  })
}, { withRef: true })
export class SelectPool extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectPools')
  }

  _computeOptions (props) {
    return map(
      props.xoObjects,
      pool => ({
        value: pool.id,
        label: pool.name_label,
        xoItem: pool
      })
    )
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
  const getSrsByContainer = getSrs.sort().groupBy('$container')

  return (state, props) => ({
    containers: getContainers(state, props),
    xoObjects: getSrs(state, props),
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
      newOptions.push({
        disabled: true,
        xoItem: container
      })

      newOptions.push.apply(newOptions,
        map(props.srsByContainer[container.id], sr => ({
          value: sr.id,
          label: `${sr.name_label} ${container.name_label}`,
          xoItem: sr
        }))
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
    xoObjects: getVms(state, props),
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
      newOptions.push({
        disabled: true,
        xoItem: container
      })

      newOptions.push.apply(newOptions,
        map(props.vmsByContainer[container.id], vm => ({
          value: vm.id,
          label: `${vm.name_label} ${container.name_label}`,
          xoItem: vm
        }))
      )
    }
    forEach(props.hostContainers, makeOptionsForContainer)
    forEach(props.poolContainers, makeOptionsForContainer)

    return newOptions
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
  const getVmsByPool = getVmTemplates.sort().groupBy('$container')

  return (state, props) => ({
    containers: getPools(state, props),
    xoObjects: getVmTemplates(state, props),
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

    forEach(props.containers, container => {
      newOptions.push({
        disabled: true,
        xoItem: container
      })

      newOptions.push.apply(newOptions,
        map(props.vmTemplatesByContainer[container.id], vm => ({
          value: vm.id,
          label: `${vm.name_label} ${container.name_label}`,
          xoItem: vm
        }))
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
  const getNetworksByPool = getNetworks.sort().groupBy('$pool')

  return (state, props) => ({
    networksByPool: getNetworksByPool(state, props),
    xoObjects: getNetworks(state, props),
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
      newOptions.push({
        disabled: true,
        xoItem: pool
      })

      newOptions.push.apply(newOptions,
        map(props.networksByPool[pool.id], network => ({
          value: network.id,
          label: `${network.name_label} ${pool.name_label}`,
          xoItem: network
        }))
      )
    })

    return newOptions
  }
}

// ===================================================================

@connectStore(() => {
  const getTags = createGetTags().filter(
    (state, props) => props.predicate
  ).sort()

  return (state, props) => ({
    xoObjects: getTags(state, props)
  })
}, { withRef: true })
export class SelectTag extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectTags')
  }

  _computeOptions (props) {
    return map(
      props.xoObjects,
      tag => ({
        value: tag,
        label: tag,
        xoItem: { type: 'tag', tag: tag }
      })
    )
  }
}

// ===================================================================
// Subscriptions objects.
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
class SelectSubscriptionObject extends Component {
  get value () {
    return this.refs.select.value
  }

  set value (value) {
    this.refs.select.value = value
  }
}

// ===================================================================

class AbstractSelectRemote extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectRemotes')
  }

  _computeOptions (props) {
    const {
      predicate,
      xoObjects
    } = props
    const remotesByGroup = groupBy(
      map(
        predicate ? filter(xoObjects, predicate) : xoObjects,
        parse
      ), 'type'
    )
    let newOptions = []

    forEach(remotesByGroup, (remotes, label) => {
      newOptions.push({
        disabled: true,
        label
      })

      newOptions.push.apply(newOptions,
        map(sortBy(remotes, 'name'), remote => ({
          value: remote.id,
          label: `${remote.name} ${label}`,
          xoItem: { type: 'remote', remote }
        }))
      )
    })

    return newOptions
  }
}

export class SelectRemote extends SelectSubscriptionObject {
  constructor (props) {
    super(props)
    this.state = {
      remotes: {}
    }
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeRemotes(remotes => {
      this.setState({
        remotes: keyBy(remotes, 'id')
      })
    })
  }

  render () {
    return (
      <AbstractSelectRemote ref='select' {...this.props} xoObjects={this.state.remotes} />
    )
  }
}

// ===================================================================

class AbstractSelectSubject extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectSubjects')
  }

  _computeOptions (props) {
    const {
      predicate,
      xoObjects
    } = props
    const subjects = predicate ? filter(xoObjects, predicate) : xoObjects

    return map(subjects, subject => {
      if (subject.email) {
        return {
          value: subject.id,
          xoItem: { type: 'user', ...subject }
        }
      }

      return {
        value: subject.id,
        xoItem: { type: 'group', ...subject }
      }
    })
  }
}

export class SelectSubject extends SelectSubscriptionObject {
  constructor (props) {
    super(props)
    this.state = {
      users: [],
      groups: []
    }
  }

  componentWillMount () {
    const unsubscribeGroups = subscribeUsers(groups => {
      this.setState({ groups })
    })

    const unsubscribeUsers = subscribeGroups(users => {
      this.setState({ users })
    })

    this.componentWillUnmount = () => {
      unsubscribeGroups()
      unsubscribeUsers()
    }
  }

  _getSubjects = () => {
    const { state } = this
    return keyBy(state.users.concat(state.groups), 'id')
  }

  render () {
    return (
      <AbstractSelectSubject ref='select' {...this.props} xoObjects={this._getSubjects()} />
    )
  }
}
