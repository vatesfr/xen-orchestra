import React from 'react'
import classNames from 'classnames'
import Icon from 'icon'
import store from 'store'
import Tooltip from 'tooltip'
import { Button } from 'react-bootstrap-4/lib'
import { parse as parseRemote } from 'xo-remote-parser'
import {
  assign,
  filter,
  flatten,
  forEach,
  groupBy,
  includes,
  isArray,
  isEmpty,
  isInteger,
  isString,
  keyBy,
  keys,
  map,
  mapValues,
  pick,
  sortBy,
  toArray
} from 'lodash'

import _ from './intl'
import uncontrollableInput from 'uncontrollable-input'
import Component from './base-component'
import propTypes from './prop-types'
import renderXoItem from './render-xo-item'
import { Select } from './form'
import {
  createCollectionWrapper,
  createFilter,
  createGetObjectsOfType,
  createGetTags,
  createSelector,
  getObject
} from './selectors'
import {
  addSubscriptions,
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

// react-select's line-height is 1.4
// https://github.com/JedWatson/react-select/blob/916ab0e62fc7394be8e24f22251c399a68de8b1c/less/multi.less#L33
// while bootstrap button's line-height is 1.25
// https://github.com/twbs/bootstrap/blob/959c4e527c6ef69623928db638267ba1c370479d/scss/_variables.scss#L342
const ADDON_BUTTON_STYLE = { lineHeight: '1.4' }

const getIds = value => value == null || isString(value) || isInteger(value)
  ? value
  : isArray(value)
    ? map(value, getIds)
    : value.id

const getOption = (object, container) => ({
  label: container
    ? `${getLabel(object)} ${getLabel(container)}`
    : getLabel(object),
  value: object.id,
  xoItem: object
})

const getLabel = object =>
  object.name_label ||
  object.name ||
  object.email ||
  (object.value && object.value.name) ||
  object.value ||
  object.label

const options = props => ({
  defaultValue: props.multi ? [] : undefined
})

// ===================================================================

/*
 * WITHOUT xoContainers :
 *
 * xoObjects: [
 *  { type: 'myType', id: 'abc', label: 'First object' },
 *  { type: 'myType', id: 'def', label: 'Second object' }
 * ]
 *
 *
 * WITH xoContainers :
 *
 * xoContainers: [
 *  { type: 'containerType', id: 'ghi', label: 'First container' },
 *  { type: 'containerType', id: 'jkl', label: 'Second container' }
 * ]
 *
 * xoObjects: {
 *  ghi: [
 *    { type: 'objectType', id: 'mno', label: 'First object' }
 *    { type: 'objectType', id: 'pqr', label: 'Second object' }
 *  ],
 *  jkl: [
 *    { type: 'objectType', id: 'stu', label: 'Third object' }
 *  ]
 * }
 */
@propTypes({
  autoFocus: propTypes.bool,
  clearable: propTypes.bool,
  disabled: propTypes.bool,
  hasSelectAll: propTypes.bool,
  multi: propTypes.bool,
  onChange: propTypes.func,
  placeholder: propTypes.any.isRequired,
  required: propTypes.bool,
  value: propTypes.any,
  xoContainers: propTypes.array,
  xoObjects: propTypes.oneOfType([
    propTypes.array,
    propTypes.objectOf(propTypes.array)
  ]).isRequired
})
export class GenericSelect extends Component {
  componentDidUpdate (prevProps) {
    const { onChange, xoObjects } = this.props

    if (!onChange || prevProps.xoObjects === xoObjects) {
      return
    }

    const ids = this._getSelectValue()
    const objectsById = this._getObjectsById()

    if (!isArray(ids)) {
      ids && !objectsById[ids] && onChange(undefined)
    } else {
      let shouldTriggerOnChange

      const newValue = isArray(ids) && mapPlus(ids, (id, push) => {
        const object = objectsById[id]

        if (object) {
          push(object)
        } else {
          shouldTriggerOnChange = true
        }
      })

      if (shouldTriggerOnChange) {
        this.props.onChange(newValue)
      }
    }
  }

  _getObjectsById = createSelector(
    () => this.props.xoObjects,
    objects => keyBy(
      isArray(objects)
        ? objects
        : flatten(toArray(objects)),
      'id'
    )
  )

  _getOptions = createSelector(
    () => this.props.xoContainers,
    () => this.props.xoObjects,
    (containers, objects) => { // createCollectionWrapper with a depth?
      const { name } = this.constructor

      if (!containers) {
        if (__DEV__ && !isArray(objects)) {
          throw new Error(`${name}: without xoContainers, xoObjects must be an array`)
        }

        return map(objects, getOption)
      }

      if (__DEV__ && isArray(objects)) {
        throw new Error(`${name}: with xoContainers, xoObjects must be an object`)
      }

      const options = []
      forEach(containers, container => {
        options.push({
          disabled: true,
          xoItem: container
        })

        forEach(objects[container.id], object => {
          options.push(getOption(object, container))
        })
      })
      return options
    }
  )

  _getSelectValue = createSelector(
    () => this.props.value,
    createCollectionWrapper(getIds)
  )

  _getNewSelectedObjects = createSelector(
    this._getObjectsById,
    value => value,
    (objectsById, value) => value == null
      ? value
      : isArray(value)
        ? map(value, value => objectsById[value.value])
        : objectsById[value.value]
  )

  _onChange = value => {
    const { onChange } = this.props
    if (onChange) {
      onChange(this._getNewSelectedObjects(value))
    }
  }

  _selectAll = () => {
    this._onChange(
      filter(this._getOptions(), ({ disabled }) => !disabled)
    )
  }

  // GroupBy: Display option with margin if not disabled and containers exists.
  _renderOption = option =>
    <span
      className={classNames(
        !option.disabled && this.props.xoContainers && 'ml-1'
      )}
    >
      {renderXoItem(option.xoItem)}
    </span>

  render () {
    const {
      autoFocus,
      disabled,
      hasSelectAll,
      multi,
      placeholder,
      required,

      clearable = Boolean(multi || !required)
    } = this.props

    const select = <Select
      {...{
        autofocus: autoFocus,
        clearable,
        disabled,
        multi,
        placeholder,
        required
      }}

      onChange={this._onChange}
      openOnFocus
      optionRenderer={this._renderOption}
      options={this._getOptions()}
      value={this._getSelectValue()}
      valueRenderer={this._renderOption}
    />

    if (!multi || !hasSelectAll) {
      return select
    }

    // `hasSelectAll` should be provided by react-select after this pull request has been merged:
    // https://github.com/JedWatson/react-select/pull/748
    // TODO: remove once it has been merged upstream.
    return <div className='input-group'>
      {select}
      <span className='input-group-btn'>
        <Tooltip content={_('selectAll')}>
          <Button type='button' bsStyle='secondary' onClick={this._selectAll} style={ADDON_BUTTON_STYLE}>
            <Icon icon='add' />
          </Button>
        </Tooltip>
      </span>
    </div>
  }
}

const makeStoreSelect = (createSelectors, defaultProps) => uncontrollableInput(options)(
  connectStore(createSelectors)(
    props =>
      <GenericSelect
        {...defaultProps}
        {...props}
      />
  )
)

const makeSubscriptionSelect = (subscribe, props) => uncontrollableInput(options)(
  class extends Component {
    constructor (props) {
      super(props)

      this._getFilteredXoContainers = createFilter(
        () => this.state.xoContainers,
        () => this.props.containerPredicate
      )

      this._getFilteredXoObjects = createSelector(
        () => this.state.xoObjects,
        () => this.state.xoContainers && this._getFilteredXoContainers(),
        () => this.props.predicate,
        (xoObjects, xoContainers, predicate) => {
          if (xoContainers == null) {
            return filter(xoObjects, predicate)
          } else {
            // Filter xoObjects with `predicate`...
            const filteredObjects = mapValues(xoObjects, xoObjectsGroup =>
              filter(xoObjectsGroup, predicate)
            )
            // ...and keep only those whose xoContainer hasn't been filtered out
            return pick(filteredObjects, map(xoContainers, container => container.id))
          }
        }
      )
    }

    componentWillMount () {
      this.componentWillUnmount = subscribe(::this.setState)
    }

    render () {
      return (
        <GenericSelect
          {...props}
          {...this.props}
          xoObjects={this._getFilteredXoObjects()}
          xoContainers={this.state.xoContainers && this._getFilteredXoContainers()}
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
}, { placeholder: _('selectVmTemplates') })

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
  const getHosts = createGetObjectsOfType('host').filter(getPredicate)
  const getNetworks = createGetObjectsOfType('network').filter(getPredicate)
  const getPools = createGetObjectsOfType('pool').filter(getPredicate)
  const getSrs = createGetObjectsOfType('SR').filter(getPredicate)
  const getVms = createGetObjectsOfType('VM').filter(getPredicate)

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

// Pass a function to @addSubscriptions to ensure subscribeIpPools and subscribeResourceSets
// are correctly imported before they are called
@addSubscriptions(() => ({
  ipPools: subscribeIpPools,
  resourceSets: subscribeResourceSets
}))
@propTypes({
  containerPredicate: propTypes.func,
  predicate: propTypes.func,
  resourceSetId: propTypes.string.isRequired
})
export class SelectResourceSetIp extends Component {
  get value () {
    return this.refs.select.value
  }

  set value (value) {
    this.refs.select.value = value
  }

  _getResourceSetIpPools = createSelector(
    () => this.props.ipPools,
    () => this.props.resourceSets,
    () => this.props.resourceSetId,
    (allIpPools, allResourceSets, resourceSetId) => {
      const { ipPools } = allResourceSets[resourceSetId]
      return filter(allIpPools, ({ id }) => includes(ipPools, id))
    }
  )

  _getIpPools = createSelector(
    () => this.props.ipPools,
    () => this.props.containerPredicate,
    (ipPools, predicate) => predicate
      ? filter(ipPools, predicate)
      : ipPools
  )

  _getIps = createSelector(
    this._getIpPools,
    () => this.props.predicate,
    () => this.props.ipPools,
    (ipPools, predicate, resolvedIpPools) => {
      return flatten(
        map(ipPools, ipPool => {
          const poolIps = map(ipPool.addresses, (address, ip) => ({
            ...address,
            id: ip,
            label: ip,
            type: 'ipAddress',
            used: !isEmpty(address.vifs)
          }))
          return predicate ? filter(poolIps, predicate) : poolIps
        })
      )
    }
  )

  render () {
    return (
      <GenericSelect
        ref='select'
        placeholder={_('selectIpPool')}
        {...this.props}
        xoObjects={this._getIps()}
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

export const SelectIp = makeSubscriptionSelect(subscriber => {
  const unsubscribeIpPools = subscribeIpPools(ipPools => {
    const sortedIpPools = sortBy(ipPools, 'name')
    const xoObjects = mapValues(
      groupBy(sortedIpPools, 'id'),
      ipPools => map(ipPools[0].addresses, (address, ip) => ({
        ...address,
        id: ip,
        label: ip,
        type: 'ipAddress',
        used: !isEmpty(address.vifs)
      }))
    )
    const xoContainers = map(sortedIpPools, ipPool => ({
      ...ipPool,
      type: 'ipPool'
    }))
    subscriber({ xoObjects, xoContainers })
  })

  return unsubscribeIpPools
}, { placeholder: _('selectIp') })

// ===================================================================

export const SelectIpPool = makeSubscriptionSelect(subscriber => {
  const unsubscribeIpPools = subscribeIpPools(ipPools => {
    subscriber({
      xoObjects: map(sortBy(ipPools, 'name'), ipPool => ({ ...ipPool, type: 'ipPool' }))
    })
  })

  return unsubscribeIpPools
}, { placeholder: _('selectIpPool') })
