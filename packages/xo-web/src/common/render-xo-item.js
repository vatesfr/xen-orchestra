import * as CM from 'complex-matcher'
import _ from 'intl'
import CopyToClipboard from 'react-copy-to-clipboard'
import PropTypes from 'prop-types'
import React from 'react'
import { get } from '@xen-orchestra/defined'
import find from 'lodash/find.js'
import isEmpty from 'lodash/isEmpty.js'

import decorate from './apply-decorators'
import Icon from './icon'
import Link from './link'
import Tooltip from './tooltip'
import { addSubscriptions, connectStore, formatSize, NumericDate, ShortDate } from './utils'
import { createGetObject, createSelector } from './selectors'
import { isSrWritable, subscribeBackupNgJobs, subscribeProxies, subscribeRemotes, subscribeUsers } from './xo'

// ===================================================================

const unknowItem = (uuid, type, placeholder) => (
  <Tooltip content={_('copyUuid', { uuid })}>
    <CopyToClipboard text={uuid}>
      <span className='text-muted' style={{ cursor: 'pointer' }}>
        {placeholder === undefined ? _('errorUnknownItem', { type }) : placeholder}
      </span>
    </CopyToClipboard>
  </Tooltip>
)

const LinkWrapper = ({ children, link, to, newTab }) =>
  link ? (
    <Link to={to} target={newTab && '_blank'}>
      {children}
    </Link>
  ) : (
    <span>{children}</span>
  )

LinkWrapper.propTypes = {
  link: PropTypes.bool,
  newTab: PropTypes.bool,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
}

// ===================================================================

export const Pool = decorate([
  connectStore(() => ({
    pool: createGetObject(),
  })),
  ({ id, pool, link, newTab }) => {
    if (pool === undefined) {
      return unknowItem(id, 'pool')
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to={`/pools/${pool.id}`}>
        <Icon icon='pool' /> {pool.name_label}
      </LinkWrapper>
    )
  },
])

Pool.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
}

Pool.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const Host = decorate([
  connectStore(() => {
    const getHost = createGetObject()
    return {
      host: getHost,
      pool: createGetObject(
        createSelector(
          getHost,
          (_, props) => props.pool,
          (host, showPool) => showPool && get(() => host.$pool)
        )
      ),
    }
  }),
  ({ id, host, pool, link, newTab, memoryFree }) => {
    if (host === undefined) {
      return unknowItem(id, 'host')
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to={`/hosts/${host.id}`}>
        <Icon icon='host' /> {host.name_label}
        {memoryFree && (
          <span>
            {' ('}
            {_('memoryFree', {
              memoryFree: formatSize(host.memory.size - host.memory.usage),
            })}
            )
          </span>
        )}
        {pool !== undefined && <span>{` - ${pool.name_label}`}</span>}
      </LinkWrapper>
    )
  },
])

Host.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  memoryFree: PropTypes.bool,
  newTab: PropTypes.bool,
  pool: PropTypes.bool,
}

Host.defaultProps = {
  link: false,
  memoryFree: false,
  newTab: false,
  pool: true,
}

// ===================================================================

export const Vm = decorate([
  connectStore(() => {
    const getVm = createGetObject()
    return {
      vm: getVm,
      container: createGetObject(createSelector(getVm, vm => get(() => vm.$container))),
    }
  }),
  ({ id, vm, container, link, newTab, name }) => {
    if (vm === undefined) {
      return unknowItem(id, 'VM', name)
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to={`/vms/${vm.id}`}>
        <Icon icon={isEmpty(vm.current_operations) ? `vm-${vm.power_state.toLowerCase()}` : 'vm-busy'} />{' '}
        {vm.name_label}
        {container !== undefined && ` (${container.name_label})`}
      </LinkWrapper>
    )
  },
])

Vm.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  name: PropTypes.string,
  newTab: PropTypes.bool,
}

Vm.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const VmTemplate = decorate([
  connectStore(() => {
    const getObject = createGetObject()
    const getPool = createGetObject(createSelector(getObject, vm => get(() => vm.$pool)))
    return (state, props) => ({
      // FIXME: props.self ugly workaround to get object as a self user
      template: getObject(state, props, props.self),
      pool: getPool(state, props),
    })
  }),
  ({ id, template, pool }) => {
    if (template === undefined) {
      return unknowItem(id, 'template')
    }

    return (
      <span>
        <Icon icon='vm' /> {template.name_label}
        {pool !== undefined && <span className='text-muted'>{` - ${pool.name_label}`}</span>}
      </span>
    )
  },
])

VmTemplate.propTypes = {
  id: PropTypes.string.isRequired,
  self: PropTypes.bool,
}

VmTemplate.defaultProps = {
  link: false,
  newTab: false,
  self: false,
}

// ===================================================================

export const Sr = decorate([
  connectStore(() => {
    const getSr = createGetObject()
    const getContainer = createGetObject(
      createSelector(
        getSr,
        (_, props) => props.container,
        (sr, showContainer) => showContainer && get(() => sr.$container)
      )
    )
    return (state, props) => ({
      // FIXME: props.self ugly workaround to get object as a self user
      sr: getSr(state, props, props.self),
      container: getContainer(state, props),
    })
  }),
  ({ id, sr, container, link, newTab, spaceLeft, self, name }) => {
    if (sr === undefined) {
      return unknowItem(id, 'SR', name)
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to={`/srs/${sr.id}`}>
        <Icon icon='sr' /> {sr.name_label}
        {!self && spaceLeft && isSrWritable(sr) && (
          <span className={!link && 'text-muted'}>
            {` (${formatSize(sr.size - sr.physical_usage)} free`}
            {sr.allocationStrategy !== undefined && ` - ${sr.allocationStrategy}`})
          </span>
        )}
        {!self && container !== undefined && <span className={!link && 'text-muted'}> - {container.name_label}</span>}
      </LinkWrapper>
    )
  },
])

Sr.propTypes = {
  container: PropTypes.bool,
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  name: PropTypes.string,
  newTab: PropTypes.bool,
  self: PropTypes.bool,
  spaceLeft: PropTypes.bool,
}

Sr.defaultProps = {
  container: true,
  link: false,
  newTab: false,
  self: false,
  spaceLeft: true,
}

// ===================================================================

export const Vdi = decorate([
  connectStore(() => {
    const getObject = createGetObject()
    const getSr = createGetObject((state, props) => {
      const vdi = getObject(state, props, props.self)
      return vdi && vdi.$SR
    })
    // FIXME: props.self ugly workaround to get object as a self user
    return (state, props) => ({
      vdi: getObject(state, props, props.self),
      sr: getSr(state, props),
    })
  }),
  ({ id, showSize, showSr, sr, vdi }) => {
    if (vdi === undefined) {
      return unknowItem(id, 'VDI')
    }

    return (
      <span>
        <Icon icon='disk' /> {vdi.name_label}
        {sr !== undefined && showSr && <span className='text-muted'> - {sr.name_label}</span>}
        {showSize && <span className='text-muted'> ({formatSize(vdi.size)})</span>}
      </span>
    )
  },
])

Vdi.propTypes = {
  id: PropTypes.string.isRequired,
  self: PropTypes.bool,
  showSize: PropTypes.bool,
}

Vdi.defaultProps = {
  self: false,
  showSize: false,
  showSr: false,
}

// ===================================================================

export const Pif = decorate([
  connectStore(() => {
    const getObject = createGetObject()
    const getNetwork = createGetObject(createSelector(getObject, pif => get(() => pif.$network)))

    // FIXME: props.self ugly workaround to get object as a self user
    return (state, props) => ({
      pif: getObject(state, props, props.self),
      network: getNetwork(state, props),
    })
  }),
  ({ id, showNetwork, pif, network }) => {
    if (pif === undefined) {
      return unknowItem(id, 'PIF')
    }

    const { carrier, device, deviceName, vlan } = pif
    const showExtraInfo = deviceName || vlan !== -1 || (showNetwork && network !== undefined)

    return (
      <span>
        <Icon icon='network' color={carrier ? 'text-success' : 'text-danger'} /> {device}
        {showExtraInfo && (
          <span>
            {' '}
            ({deviceName}
            {vlan !== -1 && (
              <span>
                {' '}
                -{' '}
                {_('keyValue', {
                  key: _('pifVlanLabel'),
                  value: vlan,
                })}
              </span>
            )}
            {showNetwork && network !== undefined && <span> - {network.name_label}</span>})
          </span>
        )}
      </span>
    )
  },
])

Pif.propTypes = {
  id: PropTypes.string.isRequired,
  self: PropTypes.bool,
  showNetwork: PropTypes.bool,
}

Pif.defaultProps = {
  self: false,
  showNetwork: false,
}

// ===================================================================

export const Network = decorate([
  connectStore(() => {
    const getObject = createGetObject()
    const getPool = createGetObject(createSelector(getObject, network => get(() => network.$pool)))

    // FIXME: props.self ugly workaround to get object as a self user
    return (state, props) => ({
      network: getObject(state, props, props.self),
      pool: getPool(state, props),
    })
  }),
  ({ id, network, pool }) => {
    if (network === undefined) {
      return unknowItem(id, 'network')
    }

    return (
      <span>
        <Icon icon='network' /> {network.name_label}
        {pool !== undefined && <span className='text-muted'>{` - ${pool.name_label}`}</span>}
      </span>
    )
  },
])

Network.propTypes = {
  id: PropTypes.string.isRequired,
  self: PropTypes.bool,
}

Network.defaultProps = {
  self: false,
}

// ===================================================================

export const Remote = decorate([
  addSubscriptions(({ id }) => ({
    remote: cb => subscribeRemotes(remotes => cb(find(remotes, { id }))),
  })),
  ({ id, remote, link, newTab }) => {
    if (remote === undefined) {
      return unknowItem(id, 'remote') // TODO: handle remotes not fetched yet
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to='/settings/remotes'>
        <Icon icon='remote' /> {remote.name}
      </LinkWrapper>
    )
  },
])

Remote.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
}

Remote.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const Proxy = decorate([
  addSubscriptions(({ id }) => ({
    proxy: cb => subscribeProxies(proxies => cb(proxies.find(proxy => proxy.id === id))),
  })),
  ({ id, proxy, link, newTab }) =>
    proxy !== undefined ? (
      <LinkWrapper
        link={link}
        newTab={newTab}
        to={{
          pathname: '/proxies',
          query: {
            s: new CM.Property('id', new CM.String(id)).toString(),
          },
        }}
      >
        <Icon icon='proxy' /> {proxy.name || proxy.address}
      </LinkWrapper>
    ) : (
      unknowItem(id, 'proxy')
    ),
])

Proxy.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
}

Proxy.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const BackupJob = decorate([
  addSubscriptions(({ id }) => ({
    job: cb => subscribeBackupNgJobs(jobs => cb(jobs.find(job => job.id === id))),
  })),
  ({ id, job, link, newTab }) => {
    if (job === undefined) {
      return unknowItem(id, 'job')
    }

    return (
      <LinkWrapper
        link={link}
        newTab={newTab}
        to={`/backup/overview?s=${encodeURIComponent(new CM.Property('id', new CM.String(id)).toString())}`}
      >
        {job.name}
      </LinkWrapper>
    )
  },
])

BackupJob.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
}

BackupJob.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const Vgpu = connectStore(() => ({
  vgpuType: createGetObject((_, props) => props.vgpu.vgpuType),
}))(({ vgpu, vgpuType }) => (
  <span>
    <Icon icon='vgpu' /> {vgpuType.modelName}
  </span>
))

Vgpu.propTypes = {
  vgpu: PropTypes.object.isRequired,
}

// ===================================================================

export const User = decorate([
  addSubscriptions(({ id }) => ({
    user: cb =>
      subscribeUsers(users => {
        const user = users.find(user => user.id === id)
        cb(user === undefined ? null : user)
      }),
  })),
  ({ defaultRender, id, link, newTab, user }) => {
    if (user === undefined) {
      return <Icon icon='loading' />
    }
    if (user === null) {
      return defaultRender || unknowItem(id, 'user')
    }
    return (
      <LinkWrapper
        link={link}
        newTab={newTab}
        to={`/settings/users?s=${encodeURIComponent(new CM.Property('id', new CM.String(id)).toString())}`}
      >
        <Icon icon='user' /> {user.email}
      </LinkWrapper>
    )
  },
])

User.propTypes = {
  defaultRender: PropTypes.node,
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
}

User.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const Pci = decorate([
  connectStore(() => ({
    pci: createGetObject(),
  })),
  ({ pci }) => (
    <span>
      {pci.class_name} {pci.device_name} ({pci.pci_id})
    </span>
  ),
])

// ===================================================================

const xoItemToRender = {
  // Subscription objects.
  cloudConfig: template => (
    <span>
      <Icon icon='template' /> {template.name}
    </span>
  ),
  group: group => (
    <span>
      <Icon icon='group' /> {group.name}
    </span>
  ),
  remote: ({ value: { id } }) => <Remote id={id} />,
  proxy: ({ id }) => <Proxy id={id} />,
  role: role => <span>{role.name}</span>,
  user: ({ id }) => <User id={id} />,
  resourceSet: resourceSet => (
    <span>
      <strong>
        <Icon icon='resource-set' /> {resourceSet.name}
      </strong>
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
  ipAddress: ({ label, used }) => {
    if (used) {
      return <strong className='text-warning'>{label}</strong>
    }
    return <span>{label}</span>
  },
  xoConfig: ({ createdAt }) => (
    <span>
      <Icon icon='xo-cloud-config' /> <ShortDate timestamp={createdAt} />
    </span>
  ),
  // XO objects.
  pool: props => <Pool {...props} />,

  VDI: props => <Vdi {...props} showSr />,
  'VDI-resourceSet': props => <Vdi {...props} self showSr />,

  // Pool objects.
  'VM-template': props => <VmTemplate {...props} />,
  'VM-template-resourceSet': props => <VmTemplate {...props} self />,
  host: props => <Host {...props} />,
  network: props => <Network {...props} />,
  'network-resourceSet': props => <Network {...props} self />,

  // SR.
  SR: props => <Sr {...props} />,
  'SR-resourceSet': props => <Sr {...props} self />,

  // VM.
  VM: props => <Vm {...props} />,
  'VM-snapshot': props => <Vm {...props} />,
  'VM-controller': props => (
    <span>
      <Icon icon='host' /> <Vm {...props} />
    </span>
  ),

  // PIF.
  PIF: props => <Pif {...props} />,

  // Tags.
  tag: tag => (
    <span>
      <Icon icon='tag' /> {tag.value}
    </span>
  ),

  // GPUs

  vgpu: vgpu => <Vgpu vgpu={vgpu} />,

  vgpuType: type => (
    <span>
      <Icon icon='gpu' /> {type.modelName} ({type.vendorName}) {type.maxResolutionX}x{type.maxResolutionY}
    </span>
  ),

  gpuGroup: group => (
    <span>{group.name_label.startsWith('Group of ') ? group.name_label.slice(9) : group.name_label}</span>
  ),

  backup: backup => (
    <span>
      <span className='tag tag-info' style={{ textTransform: 'capitalize' }}>
        {backup.mode === 'delta' ? _('backupIsIncremental') : backup.mode}
      </span>{' '}
      {backup.isImmutable && (
        <span className='tag tag-info'>
          <Icon icon='lock' />
        </span>
      )}{' '}
      <span className='tag tag-warning'>{backup.remote.name}</span>{' '}
      {backup.differencingVhds > 0 && (
        <span className='tag tag-info'>
          {backup.differencingVhds} {_('backupIsDifferencing')}{' '}
        </span>
      )}
      {backup.dynamicVhds > 0 && (
        <span className='tag tag-info'>
          {backup.dynamicVhds} {_('backupisKey')}{' '}
        </span>
      )}
      {backup.withMemory && <span className='tag tag-info'>{_('withMemory')} </span>}
      {backup.size !== undefined && <span className='tag tag-info'>{formatSize(backup.size)}</span>}{' '}
      <NumericDate timestamp={backup.timestamp} />
    </span>
  ),

  PCI: props => <Pci {...props} self />,

  schedule: schedule => {
    const isEnabled = schedule.enabled
    const scheduleName = schedule.name.trim()
    return (
      <span>
        <span className={`mr-1 tag tag-${isEnabled ? 'success' : 'danger'}`}>
          {isEnabled ? _('stateEnabled') : _('stateDisabled')}
        </span>
        <span>{scheduleName === '' ? <em>{_('unnamedSchedule')}</em> : scheduleName}</span>
      </span>
    )
  },
  job: job => <spans>{job.name}</spans>,
}

const renderXoItem = (item, { className, type: xoType, ...props } = {}) => {
  const { id, label } = item
  const type = xoType || item.type

  if (item.removed) {
    return (
      <span key={id} className='text-danger'>
        {' '}
        <Icon icon='alarm' /> {id}
      </span>
    )
  }

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
        <Component {...item} {...props} />
      </span>
    )
  }
}

export { renderXoItem as default }

export const getRenderXoItemOfType =
  type =>
  (item, options = {}) =>
    renderXoItem(item, { ...options, type })

const GenericXoItem = connectStore(() => {
  const getObject = createGetObject()

  return (state, props) => ({
    xoItem: getObject(state, props),
  })
})(({ xoItem, ...props }) => (xoItem ? renderXoItem(xoItem, props) : renderXoUnknownItem()))

export const renderXoItemFromId = (id, props) => <GenericXoItem {...props} id={id} />

export const renderXoUnknownItem = () => <span className='text-muted'>{_('errorNoSuchItem')}</span>
