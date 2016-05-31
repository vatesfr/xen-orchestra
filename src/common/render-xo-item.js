import Icon from 'icon'
import React, { Component } from 'react'
import { createGetObject } from 'selectors'

import {
  connectStore,
  formatSize,
  propTypes
} from 'utils'

// ===================================================================

const OBJECT_TYPE_TO_ICON = {
  'VM-template': 'vm',
  host: 'host',
  network: 'network'
}

// Host, Network, VM-template.
export const PoolObjectItem = propTypes({
  object: propTypes.object.isRequired
})(connectStore(() => {
  const getPool = createGetObject(
    (_, props) => props.object.$pool
  )

  return (state, props) => ({
    pool: getPool(state, props)
  })
})(({ object, pool }) => {
  const icon = OBJECT_TYPE_TO_ICON[object.type]
  const { id } = object

  return (
    <span>
      <Icon icon={icon} /> {`${object.name_label || id} `}
      {pool && `(${pool.name_label || pool.id})`}
    </span>
  )
}))

// SR.
export const SrItem = propTypes({
  sr: propTypes.object.isRequired
})(connectStore(() => {
  const getContainer = createGetObject(
    (_, props) => props.sr.$container
  )

  return (state, props) => ({
    container: getContainer(state, props)
  })
})(({ sr, container }) => {
  let label = `${sr.name_label || sr.id}`

  if (sr.content_type === 'user') {
    label += ` (${formatSize(sr.size)})`
  }

  return (
    <span>
      <Icon icon='sr' /> {label}
      {container && ` (${container.name_label || container.id})`}
    </span>
  )
}))

// VM.
export const VmItem = propTypes({
  vm: propTypes.object.isRequired
})(connectStore(() => {
  const getContainer = createGetObject(
    (_, props) => props.vm.$container
  )

  return (state, props) => ({
    container: getContainer(state, props)
  })
})(({ vm, container }) => (
  <span>
    <Icon icon={`vm-${vm.power_state.toLowerCase()}`} /> {vm.name_label || vm.id}
    {container && ` (${container.name_label || container.id})`}
  </span>
)))

// ===================================================================

const xoItemToRender = {
  // Subscription objects.
  group: group => (
    <span>
      <Icon icon='group' /> {group.name}
    </span>
  ),
  remote: remote => (
    <span>
      <Icon icon='remote' /> {remote.remote.name}
    </span>
  ),
  user: user => (
    <span>
      <Icon icon='user' /> {user.email}
    </span>
  ),

  // XO objects.
  pool: pool => (
    <span>
      <Icon icon='pool' /> {pool.name_label || pool.id}
    </span>
  ),

  // Pool objects.
  'VM-template': vmTemplate => <PoolObjectItem object={vmTemplate} />,
  host: host => <PoolObjectItem object={host} />,
  network: network => <PoolObjectItem object={network} />,

  // SR.
  SR: sr => <SrItem sr={sr} />,

  // VM.
  VM: vm => <VmItem vm={vm} />,

  // Tags.
  tag: tag => (
    <span>
      <Icon icon='tag' /> {tag.value}
    </span>
  )
}

const renderXoItem = (item, {
  className
} = {}) => {
  const { type } = item
  const Component = xoItemToRender[type]

  if (process.env.NODE_ENV !== 'production' && !Component) {
    throw new Error(`no available component for type ${type}`)
  }

  if (Component) {
    return (
      <span key={item.id} className={className}>
        <Component {...item} />
      </span>
    )
  }
}

export { renderXoItem as default }
