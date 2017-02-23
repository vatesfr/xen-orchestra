import _ from 'intl'
import React from 'react'

import Icon from './icon'
import propTypes from './prop-types'
import { createGetObject } from './selectors'
import { isSrWritable } from './xo'
import {
  connectStore,
  formatSize
} from './utils'

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

  if (isSrWritable(sr)) {
    label += ` (${formatSize(sr.size - sr.physical_usage)} free)`
  }

  return (
    <span>
      <Icon icon='sr' /> {label}
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
      <Icon icon='remote' /> {remote.value.name}
    </span>
  ),
  role: role => (
    <span>
      {role.name}
    </span>
  ),
  user: user => (
    <span>
      <Icon icon='user' /> {user.email}
    </span>
  ),
  resourceSet: resourceSet => (
    <span>
      <Icon icon='resource-set' /> {resourceSet.name}
    </span>
  ),
  sshKey: key => (
    <span>
      <Icon icon='ssh-key' /> {key.label}
    </span>
  ),
  ipPool: ipPool => (
    <span>
      <Icon icon='ip' /> {ipPool.name}
    </span>
  ),
  ipAddress: ({label, used}) => {
    if (used) {
      return <strong className='text-warning'>{label}</strong>
    }
    return <span>{label}</span>
  },

  // XO objects.
  pool: pool => (
    <span>
      <Icon icon='pool' /> {pool.name_label || pool.id}
    </span>
  ),

  VDI: vdi => (
    <span>
      <Icon icon='disk' /> {vdi.name_label} {vdi.name_description && <span> ({vdi.name_description})</span>}
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
  'VM-snapshot': vm => <VmItem vm={vm} />,
  'VM-controller': vm => (
    <span>
      <Icon icon='host' />
      {' '}
      <VmItem vm={vm} />
    </span>
  ),

  // PIF.
  PIF: pif => (
    <span>
      <Icon icon='network' /> {pif.device} ({pif.deviceName})
    </span>
  ),

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
  const { id, type, label } = item

  if (!type) {
    if (process.env.NODE_ENV !== 'production' && !label) {
      throw new Error(`an item must have at least either a type or a label`)
    }
    return (
      <span key={id} className={className}>
        {label}
      </span>
    )
  }

  const Component = xoItemToRender[type]

  if (process.env.NODE_ENV !== 'production' && !Component) {
    throw new Error(`no available component for type ${type}`)
  }

  if (Component) {
    return (
      <span key={id} className={className}>
        <Component {...item} />
      </span>
    )
  }
}

export { renderXoItem as default }

const GenericXoItem = connectStore(() => {
  const getObject = createGetObject()

  return (state, props) => ({
    xoItem: getObject(state, props)
  })
})(({ xoItem, ...props }) => xoItem
  ? renderXoItem(xoItem, props)
  : <span className='text-muted'>{_('errorNoSuchItem')}</span>
)

export const renderXoItemFromId = (id, props) => <GenericXoItem {...props} id={id} />
