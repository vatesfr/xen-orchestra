import Component from 'base-component'
import React from 'react'
import Select from 'react-select'
import _ from 'messages'
import assign from 'lodash/assign'
import filter from 'lodash/filter'
import find from 'lodash/find'
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
  propTypes
} from 'utils'

import {
  subscribeGroups,
  subscribeRemotes,
  subscribeUsers
} from 'xo'

// ===================================================================

const getLabel = object => object.name_label || object.name || object.email

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
  xoContainers: propTypes.array,
  xoObjects: propTypes.oneOfType([
    propTypes.array,
    propTypes.objectOf(propTypes.array)
  ]).isRequired
})
export class GenericSelect extends Component {
  // Supports id strings and objects.
  _setValue (value, props = this.props) {
    this.setState({
      value: props.multi
        ? map(value, object => object.id || object)
        : value.id || value
    })
  }

  componentWillMount () {
    const { props } = this

    this._setValue(props.defaultValue || (props.multi ? [] : ''))
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

      if (!xoObjects) {
        return this.setState({
          options,
          xoObjectsById
        })
      }

      // Reset selected values if options are changed.
      const value = this.value

      // For array.
      if (props.multi) {
        return this.setState({
          options,
          value: this._setValue(
            filter(value, value => value && xoObjectsById[value.id]),
            props
          ),
          xoObjectsById
        })
      }

      // For one unique selected value.
      this.setState({
        options,
        value: this._setValue(
          find(xoObjectsById, (_, id) => id === value.id) || '',
          props
        ),
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
    const { xoObjectsById, value } = this.state

    if (this.props.multi) {
      return map(value, value => xoObjectsById[value.value || value])
    }

    return xoObjectsById[value.value || value] || ''
  }

  set value (value) {
    this.setState({
      value: this._setValue(value)
    })
  }

  _handleChange = value => {
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
        placeholder={props.placeholder || this._placeholder}
        required={props.required}
        value={state.value}
        valueRenderer={this._renderOption}
      />
    )
  }
}

const makeStoreSelect = createSelectors => connectStore(() => {
  const selectors = createSelectors()

  return (state, props) =>
    mapValues(selectors, selector => selector(state, props))
})(
  class extends Component {
    get value () {
      return this.refs.select.value
    }

    set value (value) {
      this.refs.select.value = value
    }

    render () {
      return <GenericSelect ref='select' {...this.props} />
    }
  }
)

const makeSubscriptionSelect = subscribe => (
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

export const SelectHost = makeStoreSelect(
  () => {
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
  }
)

// ===================================================================

export const SelectPool = makeStoreSelect(
  () => ({
    xoObjects: createGetObjectsOfType('pool').filter(filterPredicate).sort()
  })
)

// ===================================================================

const userSrPredicate = sr => sr.content_type === 'user'

export const SelectSr = makeStoreSelect(
  () => {
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
  }
)

// ===================================================================

export const SelectVm = makeStoreSelect(
  () => {
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
  }
)

// ===================================================================

export const SelectVmTemplate = makeStoreSelect(
  () => {
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
  }
)

// ===================================================================

export const SelectNetwork = makeStoreSelect(
  () => {
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
  }
)

// ===================================================================

export const SelectTag = makeStoreSelect(
  () => {
    const getTags = createGetTags().filter(filterPredicate).sort()

    return {
      xoObjects: createSelector(
        getTags,
        tags => map(tags, tag => ({ id: tag, type: 'tag', value: 'tag' }))
      )
    }
  }
)

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
})

// ===================================================================

export const SelectRemote = makeSubscriptionSelect(subscriber => {
  const unsubscribeRemotes = subscribeRemotes(remotes => {
    const xoObjects = groupBy(
      map(sortBy(remotes, 'name'), remote => {
        remote = parseRemote(remote)
        return { id: remote.name, type: 'remote', value: remote }
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
})
