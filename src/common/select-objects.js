import Icon from 'icon'
import React, { Component } from 'react'
import Select from 'react-select'
import _ from 'messages'
import forEach from 'lodash/forEach'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
import { parse } from 'xo-remote-parser'

import {
  create as createSelector,
  createCollectionWrapper,
  objects
} from 'selectors'
import {
  autobind,
  connectStore,
  formatSize,
  propTypes
} from 'utils'

// ===================================================================

@propTypes({
  multi: propTypes.bool,
  onChange: propTypes.func,
  options: propTypes.array.isRequired,
  placeholder: propTypes.string,
  required: propTypes.bool,
  value: propTypes.any
})
class GenericSelect extends Component {
  constructor (props) {
    super(props)
    this.state = {
      value: props.value || (props.multi ? [] : '')
    }
  }

  componentWillReceiveProps (props) {
    this.options = this._computeOptions(props)
  }

  componentWillMount () {
    this.options = this._computeOptions(this.props)
  }

  get value () {
    const { value } = this.state

    if (this.props.multi) {
      return map(value, value => value.value)
    }

    return value.value
  }

  set value (value) {
    this.setState({
      value
    })
  }

  @autobind
  _handleChange (value) {
    const { onChange } = this.props

    this.setState({
      value
    }, onChange && (() => { onChange(this.value) }))
  }

  render () {
    const { props } = this

    return (
      <Select
        onChange={this._handleChange}
        optionRenderer={this._renderOption}
        options={this.options}
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

const _createContainersSelector = (set, objects, containerAttr) => {
  const containers = {}
  const objectsByContainer = {}

  forEach(set, object => {
    const containerRef = object[containerAttr]
    containers[containerRef] = objects[containerRef]

    let container = objectsByContainer[containerRef]

    if (!container) {
      container = objectsByContainer[containerRef] = {}
    }

    container[object.id] = object
  })

  return { containers, objectsByContainer }
}

const createContainersSelector = (containerAttr) =>
  createCollectionWrapper(createSelector(
    (state, props) => props.options,
    objects,
    (set, objects) => _createContainersSelector(set, objects, containerAttr)
  ))

// ===================================================================

@connectStore(() => {
  const getPools = createContainersSelector('$pool')

  return (state, props) => {
    return {
      ...getPools(state, props)
    }
  }
}, { withRef: true })
export class SelectHost extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectHosts')
  }

  _computeOptions (props) {
    let newOptions = []

    forEach(props.containers, (pool, poolId) => {
      newOptions.push({
        label: pool.name_label || poolId,
        disabled: true,
        type: 'pool'
      })

      newOptions.push.apply(newOptions,
        map(props.objectsByContainer[poolId], (host, hostId) => {
          return {
            value: hostId,
            label: host.name_label || hostId,
            type: 'host'
          }
        })
      )
    })

    return newOptions
  }

  @autobind
  _renderOption (option) {
    return (
      <div>
        <Icon icon={option.type} /> {option.label}
      </div>
    )
  }
}

// ===================================================================

export class SelectPool extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectPools')
  }

  _computeOptions (props) {
    return map(props.options, (pool, id) => ({
      value: id,
      label: pool.name_label || id
    }))
  }

  @autobind
  _renderOption (option) {
    return (
      <div>
        <Icon icon='pool' /> {option.label}
      </div>
    )
  }
}

// ===================================================================

export class SelectRemote extends GenericSelect {
  constructor (props) {
    super(props)
    this._placeholder = _('selectRemotes')
  }

  _computeOptions (props) {
    const remotesByGroup = groupBy(map(props.options, parse), 'type')
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
  const getSrsContainers = createContainersSelector('$container')

  return (state, props) => {
    return {
      ...getSrsContainers(state, props)
    }
  }
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
        map(props.objectsByContainer[containerId], sr => {
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

  @autobind
  _renderOption (option) {
    return (
      <div>
        <Icon icon={option.type} /> {option.label}
      </div>
    )
  }
}

// ===================================================================

@connectStore(() => {
  const getVmsContainers = createContainersSelector('$container')

  return (state, props) => {
    return {
      ...getVmsContainers(state, props)
    }
  }
}, { withRef: true })
export class SelectVm extends GenericSelect {
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
        map(props.objectsByContainer[containerId], vm => ({
          value: vm.id,
          label: `${vm.name_label || vm.id} (${containerLabel})`,
          vm
        }))
      )
    })

    return newOptions
  }

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
}
