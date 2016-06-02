import Component from 'base-component'
import React from 'react'
import Select from 'react-select'
import _ from 'messages'
import assign from 'lodash/assign'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'
import groupBy from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import keys from 'lodash/keys'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import renderXoItem from 'render-xo-item'
import sortBy from 'lodash/sortBy'
import { parse as parseRemote } from 'xo-remote-parser'

import {
  createFilter,
  createGetObjectsOfType,
  createGetTags,
  createSelector
} from 'selectors'

import {
  connectStore,
  mapPlus,
  propTypes
} from 'utils'

import {
  subscribeGroups,
  subscribeRemotes,
  subscribeRoles,
  subscribeUsers
} from 'xo'

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
  defaultValue: propTypes.any,
  disabled: propTypes.bool,
  multi: propTypes.bool,
  onChange: propTypes.func,
  placeholder: propTypes.any.isRequired,
  predicate: propTypes.func,
  required: propTypes.bool,
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
      value: this._setValue(props.defaultValue, props)
    }
  }

  _getValue (xoObjectsById = this.state.xoObjectsById, props = this.props) {
    const { value } = this.state

    if (props.multi) {
      // Returns the values of the selected objects
      // if they are contained in xoObjectsById.
      return mapPlus(value, (value, push) => {
        const o = xoObjectsById[value.value || value]

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
      return map(value, object => object.id || object)
    }

    return (value != null)
      ? value.id || value
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
    const { xoContainers, xoObjects } = newProps

    if (
      xoContainers !== props.xoContainers ||
      xoObjects !== props.xoObjects
    ) {
      const {
        options,
        xoObjectsById
      } = this._computeOptions(newProps)

      const value = this._getValue(xoObjectsById, newProps)

      return this.setState({
        options,
        value: this._setValue(value, newProps),
        xoObjectsById
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
    }, onChange && (() => { onChange(this.value) }))
  }

  _renderOption = option => renderXoItem(option.xoItem)

  render () {
    const { props, state } = this

    return (
      <Select
        autofocus={props.autoFocus}
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

const makeStoreSelect = (createSelectors, props) => connectStore(() => {
  const selectors = createSelectors()

  return (state, props) =>
    mapValues(selectors, selector => selector(state, props))
}, { withRef: true })(
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

const filterPredicate = (state, props) => props.predicate

// ===================================================================

export const SelectHost = makeStoreSelect(() => {
  const getHostsByPool = createGetObjectsOfType('host').filter(
    filterPredicate
  ).sort().groupBy('$pool')
  const getPools = createGetObjectsOfType('pool').pick(
    createSelector(
      getHostsByPool,
      hostsByPool => keys(hostsByPool)
    )
  ).sort()

  return {
    xoObjects: getHostsByPool,
    xoContainers: getPools
  }
}, { placeholder: _('selectHosts') })

// ===================================================================

export const SelectPool = makeStoreSelect(() => ({
  xoObjects: createGetObjectsOfType('pool').filter(filterPredicate).sort()
}), { placeholder: _('selectPools') })

// ===================================================================

const userSrPredicate = sr => sr.content_type === 'user'

export const SelectSr = makeStoreSelect(() => {
  const getSrsByContainer = createGetObjectsOfType('SR').filter(
    (_, { predicate }) => predicate || userSrPredicate
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
    filterPredicate
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

export const SelectVmTemplate = makeStoreSelect(() => {
  const getVmTemplatesByPool = createGetObjectsOfType('VM-template').filter(
    filterPredicate
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
    filterPredicate
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

export const SelectTag = makeStoreSelect(() => {
  const getTags = createGetTags().filter(filterPredicate).sort()

  return {
    xoObjects: createSelector(
      getTags,
      tags => map(tags, tag => ({ id: tag, type: 'tag', value: 'tag' }))
    )
  }
}, { placeholder: _('selectTags') })

export const SelectHighLevelObjects = makeStoreSelect(() => {
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
// Objects from subscriptions.
// ===================================================================

export const SelectSubject = makeSubscriptionSelect(subscriber => {
  let subjects = {}

  const set = newSubjects => {
    subjects = newSubjects
    subscriber({
      xoObjects: subjects
    })
  }

  const unsubscribeGroups = subscribeGroups(groups => {
    set([
      ...filter(subjects, subject => subject.type === 'user'),
      ...groups
    ])
  })

  const unsubscribeUsers = subscribeUsers(users => {
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
    console.log('ROLES', xoObjects)
    subscriber({xoObjects})
  })
  return unsubscribeRoles
}, { placeholder: _('selectRole') })

// ===================================================================

export const SelectRemote = makeSubscriptionSelect(subscriber => {
  const unsubscribeRemotes = subscribeRemotes(remotes => {
    const xoObjects = groupBy(
      map(sortBy(remotes, 'name'), remote => {
        remote = parseRemote(remote)
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
