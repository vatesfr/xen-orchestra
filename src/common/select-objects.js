import React from 'react'
import assign from 'lodash/assign'
import classNames from 'classnames'
import filter from 'lodash/filter'
import flatten from 'lodash/flatten'
import forEach from 'lodash/forEach'
import groupBy from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import keys from 'lodash/keys'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
import store from 'store'
import { parse as parseRemote } from 'xo-remote-parser'

import _ from './intl'
import Component from './base-component'
import propTypes from './prop-types'
import renderXoItem from './render-xo-item'
import { Select } from './form'
import {
  createFilter,
  createGetObjectsOfType,
  createGetTags,
  createSelector,
  getObject
} from './selectors'
import {
  connectStore,
  mapPlus,
  resolveResourceSets
} from './utils'
import {
  isSrWritable,
  subscribeCurrentUser,
  subscribeGroups,
  subscribeIpPools,
  subscribeRemotes,
  subscribeResourceSets,
  subscribeRoles,
  subscribeUsers
} from './xo'

// ===================================================================

const getLabel = object =>
  object.name_label ||
  object.name ||
  object.email ||
  (object.value && object.value.name) ||
  object.value ||
  object.label

// ===================================================================

@propTypes({
  autoFocus: propTypes.bool,
  clearable: propTypes.bool,
  defaultValue: propTypes.any,
  disabled: propTypes.bool,
  multi: propTypes.bool,
  onChange: propTypes.func,
  placeholder: propTypes.any.isRequired,
  predicate: propTypes.func,
  required: propTypes.bool,
  value: propTypes.any,
  xoContainers: propTypes.array,
  xoObjects: propTypes.oneOfType([
    propTypes.array,
    propTypes.objectOf(propTypes.array)
  ]).isRequired
})
export class GenericSelect extends Component {
  constructor (props) {
    super(props)
    this.state = {
      value: this._setValue(props.value || props.defaultValue, props)
    }
  }

  _getValue (xoObjectsById = this.state.xoObjectsById, props = this.props) {
    const { value } = this.state

    if (props.multi) {
      // Returns the values of the selected objects
      // if they are contained in xoObjectsById.
      return mapPlus(value, (value, push) => {
        const o = xoObjectsById[value.value !== undefined ? value.value : value]

        if (o) {
          push(o)
        }
      })
    }

    return xoObjectsById[value.value || value] || ''
  }

  // Supports id strings and objects.
  _setValue (value, props = this.props) {
    if (props.multi) {
      return map(value, object => object.id !== undefined ? object.id : object)
    }

    return (value != null)
      ? value.id !== undefined ? value.id : value
      : ''
  }

  componentWillMount () {
    const { props } = this

    this.setState({
      ...this._computeOptions(props)
    })
  }

  componentWillReceiveProps (newProps) {
    const { props } = this
    const { value, xoContainers, xoObjects } = newProps

    if (
      xoContainers !== props.xoContainers ||
      xoObjects !== props.xoObjects
    ) {
      const {
        options,
        xoObjectsById
      } = this._computeOptions(newProps)

      const value = this._getValue(xoObjectsById, newProps)

      this.setState({
        options,
        value: this._setValue(value, newProps),
        xoObjectsById
      })
    }

    if (value !== props.value) {
      this.setState({
        value: this._setValue(value, newProps)
      })
    }
  }

  _computeOptions ({ xoContainers, xoObjects }) {
    if (!xoContainers) {
      if (process.env.NODE_ENV !== 'production') {
        if (!Array.isArray(xoObjects)) {
          throw new Error('without xoContainers, xoObjects must be an array')
        }
      }

      return {
        xoObjectsById: keyBy(xoObjects, 'id'),
        options: map(xoObjects, object => ({
          label: getLabel(object),
          value: object.id,
          xoItem: object
        }))
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      if (Array.isArray(xoObjects)) {
        throw new Error('with xoContainers, xoObjects must be an object')
      }
    }

    const options = []
    const xoObjectsById = {}

    forEach(xoContainers, container => {
      const containerObjects = keyBy(xoObjects[container.id], 'id')
      assign(xoObjectsById, containerObjects)

      options.push({
        disabled: true,
        xoItem: container
      })

      options.push.apply(options, map(containerObjects, object => ({
        label: `${getLabel(object)} ${getLabel(container)}`,
        value: object.id,
        xoItem: object
      })))
    })

    return { xoObjectsById, options }
  }

  get value () {
    return this._getValue()
  }

  set value (value) {
    this.setState({
      value: this._setValue(value)
    })
  }

  _handleChange = value => {
    const { onChange } = this.props

    this.setState({
      value: this._setValue(value)
    }, onChange && (() => onChange(this.value)))
  }

  // GroupBy: Display option with margin if not disabled and containers exists.
  _renderOption = option => (
    <span
      className={classNames(
        !option.disabled && this.props.xoContainers && 'm-l-1'
      )}
    >
      {renderXoItem(option.xoItem)}
    </span>
  )

  render () {
    const { props, state } = this

    return (
      <Select
        autofocus={props.autoFocus}
        clearable={props.clearable}
        disabled={props.disabled}
        multi={props.multi}
        onChange={this._handleChange}
        openOnFocus
        optionRenderer={this._renderOption}
        options={state.options}
        placeholder={props.placeholder}
        required={props.required}
        value={state.value}
        valueRenderer={this._renderOption}
      />
    )
  }
}

const makeStoreSelect = (createSelectors, props) => connectStore(
  createSelectors,
  { withRef: true }
)(
  class extends Component {
    get value () {
      return this.refs.select.value
    }

    set value (value) {
      this.refs.select.value = value
    }

    render () {
      return (
        <GenericSelect
          ref='select'
          {...props}
          {...this.props}
        />
      )
    }
  }
)

const makeSubscriptionSelect = (subscribe, props) => (
  class extends Component {
    constructor (props) {
      super(props)
      this.state = {
        xoObjects: []
      }

      this._getFilteredXoObjects = createFilter(
        () => this.state.xoObjects,
        () => this.props.predicate
      )
    }

    get value () {
      return this.refs.select.value
    }

    set value (value) {
      this.refs.select.value = value
    }

    componentWillMount () {
      this.componentWillUnmount = subscribe(::this.setState)
    }

    render () {
      return (
        <GenericSelect
          ref='select'
          {...props}
          {...this.props}
          xoObjects={this._getFilteredXoObjects()}
          xoContainers={this.state.xoContainers}
        />
      )
    }
  }
)

// ===================================================================
// XO objects.
// ===================================================================

const getPredicate = (state, props) => props.predicate

// ===================================================================

export const SelectHost = makeStoreSelect(() => {
  const getHostsByPool = createGetObjectsOfType('host').filter(
    getPredicate
  ).sort()

  return {
    xoObjects: getHostsByPool
  }
}, { placeholder: _('selectHosts') })

// ===================================================================

export const SelectPool = makeStoreSelect(() => ({
  xoObjects: createGetObjectsOfType('pool').filter(getPredicate).sort()
}), { placeholder: _('selectPools') })

// ===================================================================

export const SelectSr = makeStoreSelect(() => {
  const getSrsByContainer = createGetObjectsOfType('SR').filter(
    (_, { predicate }) => predicate || isSrWritable
  ).sort().groupBy('$container')

  const getContainerIds = createSelector(
    getSrsByContainer,
    srsByContainer => keys(srsByContainer)
  )

  const getPools = createGetObjectsOfType('pool').pick(getContainerIds).sort()
  const getHosts = createGetObjectsOfType('host').pick(getContainerIds).sort()

  const getContainers = createSelector(
    getPools,
    getHosts,
    (pools, hosts) => pools.concat(hosts)
  )

  return {
    xoObjects: getSrsByContainer,
    xoContainers: getContainers
  }
}, { placeholder: _('selectSrs') })

// ===================================================================

export const SelectVm = makeStoreSelect(() => {
  const getVmsByContainer = createGetObjectsOfType('VM').filter(
    getPredicate
  ).sort().groupBy('$container')

  const getContainerIds = createSelector(
    getVmsByContainer,
    vmsByContainer => keys(vmsByContainer)
  )

  const getPools = createGetObjectsOfType('pool').pick(getContainerIds).sort()
  const getHosts = createGetObjectsOfType('host').pick(getContainerIds).sort()

  const getContainers = createSelector(
    getPools,
    getHosts,
    (pools, hosts) => pools.concat(hosts)
  )

  return {
    xoObjects: getVmsByContainer,
    xoContainers: getContainers
  }
}, { placeholder: _('selectVms') })

// ===================================================================

export const SelectHostVm = makeStoreSelect(() => {
  const getHosts = createGetObjectsOfType('host').filter(
    getPredicate
  ).sort()
  const getVms = createGetObjectsOfType('VM').filter(
    getPredicate
  ).sort()

  const getObjects = createSelector(
    getHosts,
    getVms,
    (hosts, vms) => hosts.concat(vms)
  )

  return {
    xoObjects: getObjects
  }
}, { placeholder: _('selectHostsVms') })

// ===================================================================

export const SelectVmTemplate = makeStoreSelect(() => {
  const getVmTemplatesByPool = createGetObjectsOfType('VM-template').filter(
    getPredicate
  ).sort().groupBy('$container')
  const getPools = createGetObjectsOfType('pool').pick(
    createSelector(
      getVmTemplatesByPool,
      vmTemplatesByPool => keys(vmTemplatesByPool)
    )
  ).sort()

  return {
    xoObjects: getVmTemplatesByPool,
    xoContainers: getPools
  }
}, { placeholder: _('selectVms') })

// ===================================================================

export const SelectNetwork = makeStoreSelect(() => {
  const getNetworksByPool = createGetObjectsOfType('network').filter(
    getPredicate
  ).sort().groupBy('$pool')
  const getPools = createGetObjectsOfType('pool').pick(
    createSelector(
      getNetworksByPool,
      networksByPool => keys(networksByPool)
    )
  ).sort()

  return {
    xoObjects: getNetworksByPool,
    xoContainers: getPools
  }
}, { placeholder: _('selectNetworks') })

// ===================================================================

export const SelectPif = makeStoreSelect(() => {
  const getPifsByHost = createGetObjectsOfType('PIF').filter(
    getPredicate
  ).sort().groupBy('$host')
  const getHosts = createGetObjectsOfType('host').pick(
    createSelector(
      getPifsByHost,
      networksByPool => keys(networksByPool)
    )
  ).sort()

  return {
    xoObjects: getPifsByHost,
    xoContainers: getHosts
  }
}, { placeholder: _('selectPifs') })

// ===================================================================

export const SelectTag = makeStoreSelect((_, props) => ({
  xoObjects: createSelector(
    createGetTags(
      'objects' in props
        ? (_, props) => props.objects
        : undefined
    ).filter(getPredicate).sort(),
    tags => map(tags, tag => ({ id: tag, type: 'tag', value: tag }))
  )
}), { placeholder: _('selectTags') })

export const SelectHighLevelObject = makeStoreSelect(() => {
  const getHosts = createGetObjectsOfType('host')
  const getNetworks = createGetObjectsOfType('network')
  const getPools = createGetObjectsOfType('pool')
  const getSrs = createGetObjectsOfType('SR')
  const getVms = createGetObjectsOfType('VM')

  const getHighLevelObjects = createSelector(
    getHosts,
    getNetworks,
    getPools,
    getSrs,
    getVms,
    (hosts, networks, pools, srs, vms) => sortBy(assign({}, hosts, networks, pools, srs, vms), ['type', 'name_label'])
  )

  return {xoObjects: getHighLevelObjects}
}, { placeholder: _('selectObjects') })

// ===================================================================

export const SelectVdi = propTypes({
  srPredicate: propTypes.func
})(makeStoreSelect(() => {
  const getSrs = createGetObjectsOfType('SR').filter((_, props) => props.srPredicate)
  const getVdis = createGetObjectsOfType('VDI').filter(createSelector(
    getSrs,
    getPredicate,
    (srs, predicate) => predicate ? vdi => srs[vdi.$SR] && predicate(vdi) : vdi => srs[vdi.$SR]
  )).sort().groupBy('$SR')

  return {
    xoObjects: getVdis,
    xoContainers: getSrs.sort()
  }
}, { placeholder: _('selectVdis') }))

// ===================================================================
// Objects from subscriptions.
// ===================================================================

export const SelectSubject = makeSubscriptionSelect(subscriber => {
  let subjects = {}

  let usersLoaded, groupsLoaded
  const set = newSubjects => {
    subjects = newSubjects
    /* We must wait for groups AND users options to be loaded,
     * or a previously setted value belonging to one type or another might be discarded
     * by the internal <GenericSelect>
     */
    if (usersLoaded && groupsLoaded) {
      subscriber({
        xoObjects: subjects
      })
    }
  }

  const unsubscribeGroups = subscribeGroups(groups => {
    groupsLoaded = true
    set([
      ...filter(subjects, subject => subject.type === 'user'),
      ...groups
    ])
  })

  const unsubscribeUsers = subscribeUsers(users => {
    usersLoaded = true
    set([
      ...filter(subjects, subject => subject.type === 'group'),
      ...users
    ])
  })

  return () => {
    unsubscribeGroups()
    unsubscribeUsers()
  }
}, { placeholder: _('selectSubjects') })

// ===================================================================

export const SelectRole = makeSubscriptionSelect(subscriber => {
  const unsubscribeRoles = subscribeRoles(roles => {
    const xoObjects = map(sortBy(roles, 'name'), role => ({...role, type: 'role'}))
    subscriber({xoObjects})
  })
  return unsubscribeRoles
}, { placeholder: _('selectRole') })

// ===================================================================

export const SelectRemote = makeSubscriptionSelect(subscriber => {
  const unsubscribeRemotes = subscribeRemotes(remotes => {
    const xoObjects = groupBy(
      map(sortBy(remotes, 'name'), remote => {
        remote = {...remote, ...parseRemote(remote.url)}
        return { id: remote.id, type: 'remote', value: remote }
      }),
      remote => remote.value.type
    )

    subscriber({
      xoObjects,
      xoContainers: map(xoObjects, (remote, type) => ({
        id: type,
        label: type
      }))
    })
  })

  return unsubscribeRemotes
}, { placeholder: _('selectRemotes') })

// ===================================================================

export const SelectResourceSet = makeSubscriptionSelect(subscriber => {
  const unsubscribeResourceSets = subscribeResourceSets(resourceSets => {
    const xoObjects = map(sortBy(resolveResourceSets(resourceSets), 'name'), resourceSet => ({...resourceSet, type: 'resourceSet'}))

    subscriber({xoObjects})
  })

  return unsubscribeResourceSets
}, { placeholder: _('selectResourceSets') })

// ===================================================================

export class SelectResourceSetsVmTemplate extends Component {
  get value () {
    return this.refs.select.value
  }

  set value (value) {
    this.refs.select.value = value
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeResourceSets(resourceSets => {
      this.setState({
        resourceSets: resolveResourceSets(resourceSets)
      })
    })
  }

  _getTemplates = createSelector(
    () => this.props.resourceSet,
    ({ objectsByType }) => {
      const { predicate } = this.props
      const templates = objectsByType['VM-template']
      return sortBy(predicate ? filter(templates, predicate) : templates, 'name_label')
    }
  )

  render () {
    return (
      <GenericSelect
        ref='select'
        placeholder={_('selectResourceSetsVmTemplate')}
        {...this.props}
        xoObjects={this._getTemplates()}
      />
    )
  }
}

// ===================================================================

export class SelectResourceSetsSr extends Component {
  get value () {
    return this.refs.select.value
  }

  set value (value) {
    this.refs.select.value = value
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeResourceSets(resourceSets => {
      this.setState({
        resourceSets: resolveResourceSets(resourceSets)
      })
    })
  }

  _getSrs = createSelector(
    () => this.props.resourceSet,
    ({ objectsByType }) => {
      const { predicate } = this.props
      const srs = objectsByType['SR']
      return sortBy(predicate ? filter(srs, predicate) : srs, 'name_label')
    }
  )

  render () {
    return (
      <GenericSelect
        ref='select'
        placeholder={_('selectResourceSetsSr')}
        {...this.props}
        xoObjects={this._getSrs()}
      />
    )
  }
}

// ===================================================================

export class SelectResourceSetsVdi extends Component {
  get value () {
    return this.refs.select.value
  }

  set value (value) {
    this.refs.select.value = value
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeResourceSets(resourceSets => {
      this.setState({
        resourceSets: resolveResourceSets(resourceSets)
      })
    })
  }

  _getObject (id) {
    return getObject(store.getState(), id, true)
  }

  _getSrs = createSelector(
    () => this.props.resourceSet,
    ({ objectsByType }) => {
      const { srPredicate } = this.props
      const srs = objectsByType['SR']
      return srPredicate ? filter(srs, srPredicate) : srs
    }
  )

  _getVdis = createSelector(
    this._getSrs,
    srs => sortBy(map(flatten(map(srs, sr => sr.VDIs)), this._getObject), 'name_label')
  )

  render () {
    return (
      <GenericSelect
        ref='select'
        placeholder={_('selectResourceSetsVdi')}
        {...this.props}
        xoObjects={this._getVdis()}
      />
    )
  }
}

// ===================================================================

export class SelectResourceSetsNetwork extends Component {
  get value () {
    return this.refs.select.value
  }

  set value (value) {
    this.refs.select.value = value
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeResourceSets(resourceSets => {
      this.setState({
        resourceSets: resolveResourceSets(resourceSets)
      })
    })
  }

  _getNetworks = createSelector(
    () => this.props.resourceSet,
    ({ objectsByType }) => {
      const { predicate } = this.props
      const networks = objectsByType['network']
      return sortBy(predicate ? filter(networks, predicate) : networks, 'name_label')
    }
  )

  render () {
    return (
      <GenericSelect
        ref='select'
        placeholder={_('selectResourceSetsNetwork')}
        {...this.props}
        xoObjects={this._getNetworks()}
      />
    )
  }
}

// ===================================================================

export class SelectSshKey extends Component {
  get value () {
    return this.refs.select.value
  }

  set value (value) {
    this.refs.select.value = value
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeCurrentUser(user => {
      this.setState({
        sshKeys: user && user.preferences && map(user.preferences.sshKeys, (key, id) => ({
          id,
          label: key.title,
          type: 'sshKey'
        }))
      })
    })
  }

  render () {
    return (
      <GenericSelect
        ref='select'
        placeholder={_('selectSshKey')}
        {...this.props}
        xoObjects={this.state.sshKeys || []}
      />
    )
  }
}

// ===================================================================

export class SelectIp extends Component {
  get value () {
    return this.refs.select.value
  }

  set value (value) {
    this.refs.select.value = value
  }

  _formatIps = ipPools => {
    const addresses = {}
    const { predicate } = this.props
    forEach(ipPools, ipPool => {
      addresses[ipPool.id] = mapPlus(ipPool.addresses, (ip, push, key) => {
        if (!predicate || predicate(ip, key)) {
          push({
            id: key,
            label: key
          })
        }
      })
    })
    return addresses
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeIpPools(ipPools => {
      this.setState({
        ipPools: map(ipPools, ipPool => ({
          id: ipPool.id,
          label: ipPool.name,
          type: 'ipPool'
        })),
        addresses: this._formatIps(ipPools)
      })
    })
  }

  render () {
    return (
      <GenericSelect
        ref='select'
        placeholder={_('selectIp')}
        {...this.props}
        xoContainers={this.state.ipPools || []}
        xoObjects={this.state.addresses}
      />
    )
  }
}
