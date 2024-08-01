import decorate from 'apply-decorators'
import React from 'react'
import PropTypes from 'prop-types'
import { injectState, provideState } from 'reaclette'
import { parse as parseRemote } from 'xo-remote-parser'
import {
  filter,
  flatten,
  forEach,
  groupBy,
  includes,
  isEmpty,
  isInteger,
  keyBy,
  keys,
  map,
  mapValues,
  pick,
  sortBy,
  toArray,
} from 'lodash'

import _ from './intl'
import Button from './button'
import EphemeralInput from './ephemeral-input'
import Icon from './icon'
import renderXoItem from './render-xo-item'
import Select from './form/select'
import store from './store'
import Tooltip from './tooltip'
import uncontrollableInput from 'uncontrollable-input'
import {
  createCollectionWrapper,
  createFilter,
  createGetObjectsOfType,
  createGetTags,
  createSelector,
  createSort,
  getObject,
} from './selectors'
import { addSubscriptions, connectStore, resolveResourceSets } from './utils'
import {
  isSrWritable,
  subscribeBackupNgJobs,
  subscribeCloudConfigs,
  subscribeCloudXoConfigBackups,
  subscribeCurrentUser,
  subscribeGroups,
  subscribeIpPools,
  subscribeMetadataBackupJobs,
  subscribeMirrorBackupJobs,
  subscribeNetworkConfigs,
  subscribeProxies,
  subscribeRemotes,
  subscribeResourceSets,
  subscribeRoles,
  subscribeSchedules,
  subscribeUsers,
} from './xo'
import { toggleState } from './reaclette-utils'

// ===================================================================

// react-select's line-height is 1.4
// https://github.com/JedWatson/react-select/blob/916ab0e62fc7394be8e24f22251c399a68de8b1c/less/multi.less#L33
// while bootstrap button's line-height is 1.25
// https://github.com/twbs/bootstrap/blob/959c4e527c6ef69623928db638267ba1c370479d/scss/_variables.scss#L342
const ADDON_BUTTON_STYLE = { lineHeight: '1.4' }

const getIds = value =>
  value == null || typeof value === 'string' || isInteger(value)
    ? value
    : Array.isArray(value)
      ? map(value, getIds)
      : value.id

const getOption = (object, container) => ({
  label: container ? `${getLabel(object)} ${getLabel(container)}` : getLabel(object),
  value: object.id,
  xoItem: object,
})

const getLabel = object =>
  object.name_label ||
  object.name ||
  object.email ||
  (object.value && object.value.name) ||
  object.value ||
  object.label

const options = props => ({
  defaultValue: props.multi ? [] : undefined,
})

const getObjectsById = objects => keyBy(Array.isArray(objects) ? objects : flatten(toArray(objects)), 'id')

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
class GenericSelect extends React.Component {
  static propTypes = {
    allowMissingObjects: PropTypes.bool,
    compareContainers: PropTypes.func,
    compareOptions: PropTypes.func,
    hasSelectAll: PropTypes.bool,
    multi: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    xoContainers: PropTypes.array,
    xoObjects: PropTypes.oneOfType([PropTypes.array, PropTypes.objectOf(PropTypes.array)]).isRequired,
  }

  _getSelectedIds = createSelector(() => this.props.value, createCollectionWrapper(getIds))

  _getObjects = createSelector(
    () => this.props.xoContainers !== undefined,
    () => this.props.xoObjects,
    this._getSelectedIds,
    () => !this.props.allowMissingObjects,
    (withContainers, objects, ids, removed) => {
      const objectsById = getObjectsById(objects)
      const missingObjects = []
      const addIfMissing = id => {
        if (id != null && !(id in objectsById)) {
          missingObjects.push({
            id,
            label: id,
            removed,
            value: id,
          })
        }
      }
      if (Array.isArray(ids)) {
        ids.forEach(addIfMissing)
      } else {
        addIfMissing(ids)
      }

      return isEmpty(missingObjects)
        ? objects
        : withContainers
          ? {
              ...objects,
              missingObjects,
            }
          : [...objects, ...missingObjects]
    }
  )

  _getObjectsById = createSelector(this._getObjects, getObjectsById)

  _getOptions = createSelector(
    () => this.props.xoContainers,
    this._getObjects,
    () => this.props.compareContainers,
    () => this.props.compareOptions,
    (containers, objects, compareContainers, compareOptions) => {
      // createCollectionWrapper with a depth?
      const { name } = this.constructor

      let options
      if (containers === undefined) {
        if (__DEV__ && !Array.isArray(objects)) {
          throw new Error(`${name}: without xoContainers, xoObjects must be an array`)
        }

        options = (compareOptions !== undefined ? objects.sort(compareOptions) : objects).map(getOption)
      } else {
        if (__DEV__ && Array.isArray(objects)) {
          throw new Error(`${name}: with xoContainers, xoObjects must be an object`)
        }

        options = []
        const _containers = compareContainers !== undefined ? containers.sort(compareContainers) : containers
        forEach(_containers, container => {
          options.push({
            disabled: true,
            xoItem: container,
          })

          const _objects =
            compareOptions !== undefined ? objects[container.id].sort(compareOptions) : objects[container.id]
          forEach(_objects, object => {
            options.push(getOption(object, container))
          })
        })

        // missing objects have "missingObjects" as container
        const { missingObjects } = objects
        if (missingObjects !== undefined) {
          missingObjects.forEach(object => {
            options.push(getOption(object))
          })
        }
      }

      options.map(option => {
        if (option.xoItem.removed) {
          option.disabled = true
        }
        return option
      })
      return options
    }
  )

  _getSelectedObjects = (() => {
    const helper = createSelector(
      this._getObjectsById,
      value => value,
      (objectsById, value) =>
        Array.isArray(value) ? map(value, value => objectsById[value.value]) : objectsById[value.value]
    )
    return value => (value == null ? value : helper(value))
  })()

  _onChange = value => {
    this.props.onChange(this._getSelectedObjects(value))
  }

  _selectAll = () => {
    this._onChange(filter(this._getOptions(), ({ disabled }) => !disabled))
  }

  // GroupBy: Display option with margin if not disabled and containers exists.
  _renderOption = option => {
    // xoItem.type === "backup" must be rendered as `backupJob`,
    // The `backup` key already exists in `xoItemToRender`
    // and represents a backup execution. Here we want to represent a backup job
    const type = option.xoItem.type === 'backup' ? 'backupJob' : option.xoItem.type
    return (
      <span className={!option.disabled && this.props.xoContainers !== undefined ? 'ml-1' : undefined}>
        {renderXoItem(option.xoItem, {
          type: this.props.resourceSet !== undefined && type !== undefined ? `${type}-resourceSet` : type,
          memoryFree: option.xoItem.type === 'host' || undefined,
          showNetwork: true,
        })}
      </span>
    )
  }

  render() {
    const { hasSelectAll, xoContainers, xoObjects, ...props } = this.props

    const select = (
      <Select
        {...props}
        onChange={this._onChange}
        openOnFocus
        optionRenderer={this._renderOption}
        options={this._getOptions()}
        value={this._getSelectedIds()}
      />
    )

    if (!props.multi || !hasSelectAll) {
      return select
    }

    // `hasSelectAll` should be provided by react-select after this pull request has been merged:
    // https://github.com/JedWatson/react-select/pull/748
    // TODO: remove once it has been merged upstream.
    return (
      <div className='input-group'>
        {select}
        <span className='input-group-btn'>
          <Tooltip content={_('selectAll')}>
            <Button onClick={this._selectAll} style={ADDON_BUTTON_STYLE}>
              <Icon icon='add' />
            </Button>
          </Tooltip>
        </span>
      </div>
    )
  }
}

const makeStoreSelect = (createSelectors, defaultProps) =>
  uncontrollableInput(options)(connectStore(createSelectors)(props => <GenericSelect {...defaultProps} {...props} />))

const makeSubscriptionSelect = (subscribe, { placeholder, placeholderMulti = placeholder, ...props } = {}) =>
  uncontrollableInput(options)(
    class extends React.PureComponent {
      state = {}

      _getFilteredXoContainers = createFilter(
        () => this.state.xoContainers,
        () => this.props.containerPredicate
      )

      _getFilteredXoObjects = createSelector(
        () => this.state.xoObjects,
        () => this.state.xoContainers && this._getFilteredXoContainers(),
        () => this.props.predicate,
        (xoObjects, xoContainers, predicate) => {
          if (xoContainers == null) {
            return filter(xoObjects, predicate)
          } else {
            // Filter xoObjects with `predicate`...
            const filteredObjects = mapValues(xoObjects, xoObjectsGroup => filter(xoObjectsGroup, predicate))
            // ...and keep only those whose xoContainer hasn't been filtered out
            return pick(
              filteredObjects,
              map(xoContainers, container => container.id)
            )
          }
        }
      )

      componentWillMount() {
        this.componentWillUnmount = subscribe(::this.setState)
      }

      render() {
        return (
          <GenericSelect
            {...props}
            {...this.props}
            placeholder={this.props.multi ? placeholderMulti : placeholder}
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

export const SelectHost = makeStoreSelect(
  () => {
    const getHostsByPool = createGetObjectsOfType('host').filter(getPredicate).sort().groupBy('$pool')

    const getPools = createGetObjectsOfType('pool')
      .pick(createSelector(getHostsByPool, hostsByPool => Object.keys(hostsByPool)))
      .sort()

    return {
      xoObjects: getHostsByPool,
      xoContainers: getPools,
    }
  },
  { placeholder: _('selectHosts') }
)

// ===================================================================

export const SelectPool = makeStoreSelect(
  () => ({
    xoObjects: createGetObjectsOfType('pool').filter(getPredicate).sort(),
  }),
  { placeholder: _('selectPools') }
)

// ===================================================================

export const SelectSr = makeStoreSelect(
  () => {
    const getPools = createGetObjectsOfType('pool')
    const getHosts = createGetObjectsOfType('host')

    const getSrsByContainer = createGetObjectsOfType('SR')
      .filter((_, { predicate }) => predicate || isSrWritable)
      .sort()
      .groupBy('$container')

    const getContainerIds = createSelector(getSrsByContainer, srsByContainer => keys(srsByContainer))

    const getContainers = createSelector(
      getPools.pick(getContainerIds).sort(),
      getHosts.pick(getContainerIds).sort(),
      (pools, hosts) => pools.concat(hosts)
    )

    return {
      xoObjects: getSrsByContainer,
      xoContainers: getContainers,
    }
  },
  { placeholder: _('selectSrs') }
)

// ===================================================================

export const SelectVm = makeStoreSelect(
  () => {
    const getVmsByContainer = createGetObjectsOfType('VM').filter(getPredicate).sort().groupBy('$container')

    const getContainerIds = createSelector(getVmsByContainer, vmsByContainer => keys(vmsByContainer))

    const getPools = createGetObjectsOfType('pool').pick(getContainerIds).sort()
    const getHosts = createGetObjectsOfType('host').pick(getContainerIds).sort()

    const getContainers = createSelector(getPools, getHosts, (pools, hosts) => pools.concat(hosts))

    return {
      xoObjects: getVmsByContainer,
      xoContainers: getContainers,
    }
  },
  { placeholder: _('selectVms') }
)

// ===================================================================

export const SelectVmSnapshot = makeStoreSelect(
  () => {
    const getSnapshotsByVms = createGetObjectsOfType('VM-snapshot').filter(getPredicate).sort().groupBy('$snapshot_of')

    const getVms = createGetObjectsOfType('VM').pick(createSelector(getSnapshotsByVms, keys)).sort()

    return {
      xoObjects: getSnapshotsByVms,
      xoContainers: getVms,
    }
  },
  { placeholder: _('selectVmSnapshots') }
)

// ===================================================================

export const SelectHostVm = makeStoreSelect(
  () => {
    const getHosts = createGetObjectsOfType('host').filter(getPredicate).sort()
    const getVms = createGetObjectsOfType('VM').filter(getPredicate).sort()

    const getObjects = createSelector(getHosts, getVms, (hosts, vms) => hosts.concat(vms))

    return {
      xoObjects: getObjects,
    }
  },
  { placeholder: _('selectHostsVms') }
)

// ===================================================================

export const SelectVmTemplate = makeStoreSelect(
  () => {
    const getVmTemplatesByPool = createGetObjectsOfType('VM-template').filter(getPredicate).sort().groupBy('$pool')
    const getPools = createGetObjectsOfType('pool')
      .pick(createSelector(getVmTemplatesByPool, vmTemplatesByPool => keys(vmTemplatesByPool)))
      .sort()

    return {
      xoObjects: getVmTemplatesByPool,
      xoContainers: getPools,
    }
  },
  { placeholder: _('selectVmTemplates') }
)

// ===================================================================

export const SelectNetwork = makeStoreSelect(
  () => {
    const getNetworksByPool = createGetObjectsOfType('network').filter(getPredicate).sort().groupBy('$pool')
    const getPools = createGetObjectsOfType('pool')
      .pick(createSelector(getNetworksByPool, networksByPool => keys(networksByPool)))
      .sort()

    return {
      xoObjects: getNetworksByPool,
      xoContainers: getPools,
    }
  },
  { placeholder: _('selectNetworks') }
)

// ===================================================================

export const SelectPif = makeStoreSelect(
  () => {
    const getPifsByHost = createGetObjectsOfType('PIF').filter(getPredicate).sort().groupBy('$host')
    const getHosts = createGetObjectsOfType('host')
      .pick(createSelector(getPifsByHost, networksByPool => keys(networksByPool)))
      .sort()

    return {
      xoObjects: getPifsByHost,
      xoContainers: getHosts,
    }
  },
  { placeholder: _('selectPifs') }
)

// ===================================================================

const GenericSelectTag = makeStoreSelect(
  (_, props) => ({
    xoObjects: createSelector(
      createGetTags('objects' in props ? (_, props) => props.objects : undefined)
        .filter(getPredicate)
        .sort(),
      tags => map(tags, tag => ({ id: tag, type: 'tag', value: tag }))
    ),
  }),
  { allowMissingObjects: true, placeholder: _('selectTags') }
)

export const SelectTag = decorate([
  provideState({
    initialState: () => ({
      editing: false,
    }),
    effects: {
      addTag:
        (effects, newTag) =>
        ({ value }, { multi, onChange }) => {
          if (newTag === value || (multi && includes(value, newTag))) {
            return
          }
          const _newTag = { id: newTag, type: 'tag', value: newTag }
          onChange(multi ? [...map(value, tag => ({ id: tag, type: 'tag', value: tag })), _newTag] : _newTag)
        },
      closeEdition: () => ({ editing: false }),
      toggleState,
    },
    computed: {
      value: createCollectionWrapper((_, { value }) => getIds(value)),
    },
  }),
  injectState,
  ({ state, effects, resetState, allowCustomTag, ...props }) => (
    <span>
      {allowCustomTag ? (
        state.editing ? (
          <EphemeralInput closeEdition={effects.closeEdition} onChange={effects.addTag} type='text' />
        ) : (
          <Tooltip content={_('customTag')}>
            <Button name='editing' onClick={effects.toggleState} size='small'>
              <Icon icon='edit' />
            </Button>
          </Tooltip>
        )
      ) : null}
      <GenericSelectTag {...props} />
    </span>
  ),
])

SelectTag.propTypes = {
  allowCustomTag: PropTypes.bool,
}

SelectTag.defaultProps = {
  allowCustomTag: true,
}

// ===================================================================

export const SelectHighLevelObject = makeStoreSelect(
  () => {
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
      (hosts, networks, pools, srs, vms) =>
        sortBy(Object.assign({}, hosts, networks, pools, srs, vms), ['type', 'name_label'])
    )

    return { xoObjects: getHighLevelObjects }
  },
  { placeholder: _('selectObjects') }
)

// ===================================================================

export const SelectVdi = makeStoreSelect(
  () => {
    const getSrs = createGetObjectsOfType('SR').filter((_, props) => props.srPredicate)
    const getVdis = createGetObjectsOfType('VDI')
      .filter(
        createSelector(getSrs, getPredicate, (srs, predicate) =>
          predicate ? vdi => srs[vdi.$SR] && predicate(vdi) : vdi => srs[vdi.$SR]
        )
      )
      .sort()
      .groupBy('$SR')

    return {
      xoObjects: getVdis,
      xoContainers: getSrs.sort(),
    }
  },
  { placeholder: _('selectVdis') }
)
SelectVdi.propTypes = {
  srPredicate: PropTypes.func,
}

// ===================================================================

export const SelectVgpuType = makeStoreSelect(
  () => {
    const getVgpuTypes = createSelector(createGetObjectsOfType('vgpuType').filter(getPredicate), vgpuTypes => {
      const gpuGroups = {}
      forEach(vgpuTypes, vgpuType => {
        forEach(vgpuType.gpuGroups, gpuGroup => {
          if (gpuGroups[gpuGroup] === undefined) {
            gpuGroups[gpuGroup] = []
          }
          gpuGroups[gpuGroup].push({
            ...vgpuType,
            gpuGroup,
          })
        })
      })

      return gpuGroups
    })

    const getGpuGroups = createGetObjectsOfType('gpuGroup').pick(createSelector(getVgpuTypes, keys)).sort()

    return {
      xoObjects: getVgpuTypes,
      xoContainers: getGpuGroups,
    }
  },
  { placeholder: _('selectVgpuType') }
)

// ===================================================================
// Objects from subscriptions.
// ===================================================================

export const SelectSubject = makeSubscriptionSelect(
  subscriber => {
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
          xoObjects: subjects,
        })
      }
    }

    const unsubscribeGroups = subscribeGroups(groups => {
      groupsLoaded = true
      set([...filter(subjects, subject => subject.type === 'user'), ...groups])
    })

    const unsubscribeUsers = subscribeUsers(users => {
      usersLoaded = true
      set([...filter(subjects, subject => subject.type === 'group'), ...users])
    })

    return () => {
      unsubscribeGroups()
      unsubscribeUsers()
    }
  },
  { placeholder: _('selectSubjects') }
)

export const SelectUser = makeSubscriptionSelect(
  subscriber => {
    const unsubscribeUsers = subscribeUsers(users => {
      subscriber({
        xoObjects: users,
      })
    })

    return unsubscribeUsers
  },
  { placeholder: _('selectUser') }
)

// ===================================================================

export const SelectRole = makeSubscriptionSelect(
  subscriber => {
    const unsubscribeRoles = subscribeRoles(roles => {
      const xoObjects = map(sortBy(roles, 'name'), role => ({
        ...role,
        type: 'role',
      }))
      subscriber({ xoObjects })
    })
    return unsubscribeRoles
  },
  { placeholder: _('selectRole') }
)

// ===================================================================

export const SelectRemote = makeSubscriptionSelect(
  subscriber => {
    const unsubscribeRemotes = subscribeRemotes(remotes => {
      const xoObjects = groupBy(
        map(sortBy(remotes, 'name'), remote => ({
          id: remote.id,
          type: 'remote',
          value: { ...remote, ...parseRemote(remote.url) },
        })).filter(r => !r.value.invalid),
        remote => remote.value.type
      )

      subscriber({
        xoObjects,
        xoContainers: map(xoObjects, (remote, type) => ({
          id: type,
          label: type,
        })),
      })
    })

    return unsubscribeRemotes
  },
  { placeholder: _('selectRemotes') }
)

// ===================================================================

export const SelectProxy = makeSubscriptionSelect(
  subscriber =>
    subscribeProxies(proxies => {
      subscriber({
        xoObjects: sortBy(proxies, 'name').map(proxy => ({
          ...proxy,
          type: 'proxy',
        })),
      })
    }),
  { placeholderMulti: _('selectProxies'), placeholder: _('selectProxy') }
)

// ===================================================================

export const SelectResourceSet = makeSubscriptionSelect(
  subscriber => {
    const unsubscribeResourceSets = subscribeResourceSets(resourceSets => {
      const xoObjects = map(sortBy(resolveResourceSets(resourceSets), 'name'), resourceSet => ({
        ...resourceSet,
        type: 'resourceSet',
      }))

      subscriber({ xoObjects })
    })

    return unsubscribeResourceSets
  },
  { placeholder: _('selectResourceSets') }
)

// ===================================================================

export class SelectResourceSetsVmTemplate extends React.PureComponent {
  get value() {
    return this.refs.select.value
  }

  set value(value) {
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

  render() {
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

export class SelectResourceSetsSr extends React.PureComponent {
  get value() {
    return this.refs.select.value
  }

  set value(value) {
    this.refs.select.value = value
  }

  _getSrs = createSort(
    createFilter(
      () => this.props.resourceSet.objectsByType.SR,
      createSelector(
        () => this.props.predicate,
        predicate => predicate || (() => true)
      )
    ),
    'name_label'
  )

  render() {
    return (
      <GenericSelect ref='select' placeholder={_('selectResourceSetsSr')} {...this.props} xoObjects={this._getSrs()} />
    )
  }
}

// ===================================================================

export class SelectResourceSetsVdi extends React.PureComponent {
  get value() {
    return this.refs.select.value
  }

  set value(value) {
    this.refs.select.value = value
  }

  _getObject(id) {
    return getObject(store.getState(), id, true)
  }

  _getSrs = createSelector(
    () => this.props.resourceSet,
    ({ objectsByType }) => {
      const { srPredicate } = this.props
      const srs = objectsByType.SR
      return srPredicate ? filter(srs, srPredicate) : srs
    }
  )

  _getVdis = createSelector(this._getSrs, srs =>
    sortBy(map(flatten(map(srs, sr => sr.VDIs)), this._getObject), 'name_label')
  )

  render() {
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

export class SelectResourceSetsNetwork extends React.PureComponent {
  get value() {
    return this.refs.select.value
  }

  set value(value) {
    this.refs.select.value = value
  }

  _getNetworks = createSort(
    createFilter(
      () => this.props.resourceSet.objectsByType.network,
      createSelector(
        () => this.props.predicate,
        predicate => predicate || (() => true)
      )
    ),
    'name_label'
  )

  render() {
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
  resourceSets: subscribeResourceSets,
}))
export class SelectResourceSetIp extends React.Component {
  static propTypes = {
    containerPredicate: PropTypes.func,
    predicate: PropTypes.func,
    resourceSetId: PropTypes.string.isRequired,
  }

  get value() {
    return this.refs.select.value
  }

  set value(value) {
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
    (ipPools, predicate) => (predicate ? filter(ipPools, predicate) : ipPools)
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
            used: !isEmpty(address.vifs),
          }))
          return predicate ? filter(poolIps, predicate) : poolIps
        })
      )
    }
  )

  render() {
    return <GenericSelect ref='select' placeholder={_('selectIpPool')} {...this.props} xoObjects={this._getIps()} />
  }
}

// ===================================================================

export class SelectSshKey extends React.PureComponent {
  state = {}

  get value() {
    return this.refs.select.value
  }

  set value(value) {
    this.refs.select.value = value
  }

  componentWillMount() {
    this.componentWillUnmount = subscribeCurrentUser(user => {
      this.setState({
        sshKeys:
          user &&
          user.preferences &&
          map(user.preferences.sshKeys, (key, id) => ({
            id,
            label: key.title,
            type: 'sshKey',
          })),
      })
    })
  }

  render() {
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

export const SelectIp = makeSubscriptionSelect(
  subscriber => {
    const unsubscribeIpPools = subscribeIpPools(ipPools => {
      const sortedIpPools = sortBy(ipPools, 'name')
      const xoObjects = mapValues(groupBy(sortedIpPools, 'id'), ipPools =>
        map(ipPools[0].addresses, (address, ip) => ({
          ...address,
          id: ip,
          label: ip,
          type: 'ipAddress',
          used: !isEmpty(address.vifs),
        }))
      )
      const xoContainers = map(sortedIpPools, ipPool => ({
        ...ipPool,
        type: 'ipPool',
      }))
      subscriber({ xoObjects, xoContainers })
    })

    return unsubscribeIpPools
  },
  { placeholder: _('selectIp') }
)

// ===================================================================

export const SelectIpPool = makeSubscriptionSelect(
  subscriber => {
    const unsubscribeIpPools = subscribeIpPools(ipPools => {
      subscriber({
        xoObjects: map(sortBy(ipPools, 'name'), ipPool => ({
          ...ipPool,
          type: 'ipPool',
        })),
      })
    })

    return unsubscribeIpPools
  },
  { placeholder: _('selectIpPool') }
)

// ===================================================================

export const SelectCloudConfig = makeSubscriptionSelect(
  subscriber =>
    subscribeCloudConfigs(cloudConfigs => {
      subscriber({
        xoObjects: map(sortBy(cloudConfigs, 'name'), cloudConfig => ({
          ...cloudConfig,
          type: 'cloudConfig',
        })),
      })
    }),
  { placeholder: _('selectCloudConfigs') }
)

export const SelectNetworkConfig = makeSubscriptionSelect(
  subscriber =>
    subscribeNetworkConfigs(networkConfigs => {
      subscriber({
        xoObjects: map(sortBy(networkConfigs, 'name'), networkConfigs => ({
          ...networkConfigs,
          type: 'cloudConfig',
        })),
      })
    }),
  { placeholder: _('selectNetworkConfigs') }
)

// ===================================================================

export const SelectXoCloudConfig = makeSubscriptionSelect(
  subscriber =>
    subscribeCloudXoConfigBackups(configs => {
      const xoObjects = groupBy(
        map(configs, config => ({ ...config, type: 'xoConfig' }))
          // from newest to oldest
          .sort((a, b) => b.createdAt - a.createdAt),
        'xoaId'
      )
      subscriber({
        xoObjects,
        xoContainers: map(xoObjects, (configs, id) => ({ ...configs, id, type: 'VM' })),
      })
    }),
  { placeholder: _('selectXoConfig') }
)

// ===================================================================

export const SelectSchedule = makeSubscriptionSelect(
  subscriber => {
    let schedules, jobs, backupJobs, mirrorJobs, metadataJobs
    const updateData = () => {
      if (
        schedules !== undefined &&
        jobs !== undefined &&
        backupJobs !== undefined &&
        mirrorJobs !== undefined &&
        metadataJobs !== undefined
      ) {
        // everything is loaded
        subscriber({
          xoObjects: groupBy(schedules, 'jobId'),
          xoContainers: [...jobs, ...backupJobs, ...mirrorJobs, ...metadataJobs],
        })
      }
    }
    const unsubscribeSchedules = subscribeSchedules(_schedules => {
      schedules = _schedules.map(schedule => ({ ...schedule, type: 'schedule' }))
      updateData()
    })

    const unsubscribeJobs = subscribeJobs(_jobs => {
      jobs = _jobs.map(_job => ({ ..._job, type: 'job' }))
      updateData()
    })
    const unsubscribeBackupJobs = subscribeBackupNgJobs(_jobs => {
      backupJobs = _jobs.map(_job => ({ ..._job, type: 'job' }))
      updateData()
    })
    const unsubscribeMirrorBackupJobs = subscribeMirrorBackupJobs(_jobs => {
      mirrorJobs = _jobs.map(_job => ({ ..._job, type: 'job' }))
      updateData()
    })
    const unsubscribeMetadataJobs = subscribeMetadataBackupJobs(_jobs => {
      metadataJobs = _jobs.map(_job => ({ ..._job, type: 'job' }))
      updateData()
    })

    return () => {
      unsubscribeSchedules()
      unsubscribeJobs()
      unsubscribeBackupJobs()
      unsubscribeMirrorBackupJobs()
      unsubscribeMetadataJobs()
    }
  },
  { placeholder: _('selectSchedule') }
)

// ===================================================================

export const SelectBackupJob = makeSubscriptionSelect(
  subscriber => {
    let xoObjects = []

    let backupJobsLoaded, metadataJobsLoaded, mirrorJobsLoaded
    const set = newObjects => {
      xoObjects = newObjects

      if (backupJobsLoaded && metadataJobsLoaded && mirrorJobsLoaded) {
        subscriber({
          xoObjects: sortBy(xoObjects, 'name'),
        })
      }
    }
    const unsubscribeBackupJob = subscribeBackupNgJobs(backupJobs => {
      backupJobsLoaded = true
      set([...xoObjects.filter(obj => obj.type !== 'backup'), ...backupJobs])
    })

    const unsubscribeMetadataJob = subscribeMetadataBackupJobs(metadataJobs => {
      metadataJobsLoaded = true
      set([...xoObjects.filter(obj => obj.type !== 'metadataBackup'), ...metadataJobs])
    })

    const unsubscribeMirrorJob = subscribeMirrorBackupJobs(mirrorJobs => {
      mirrorJobsLoaded = true
      set([...xoObjects.filter(obj => obj.type !== 'mirrorBackup'), ...mirrorJobs])
    })

    return () => {
      unsubscribeBackupJob()
      unsubscribeMetadataJob()
      unsubscribeMirrorJob()
    }
  },
  {
    placeholder: _('selectBackupJob'),
  }
)
