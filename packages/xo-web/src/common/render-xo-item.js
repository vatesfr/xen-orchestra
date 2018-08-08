import _ from 'intl'
import Component from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'
import { get } from '@xen-orchestra/defined'
import { find, startsWith } from 'lodash'

import decorate from './apply-decorators'
import Icon from './icon'
import Link from './link'
import { addSubscriptions, connectStore, formatSize } from './utils'
import { createGetObject, createSelector } from './selectors'
import { FormattedDate } from 'react-intl'
import { isSrWritable, subscribeRemotes } from './xo'

// ===================================================================

const UNKNOWN_ITEM = <span className='text-muted'>{_('errorUnknownItem')}</span>

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
  ({ pool, link, newTab }) => {
    if (pool === undefined) {
      return UNKNOWN_ITEM
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
          host => get(() => host.$pool)
        )
      ),
    }
  }),
  ({ host, pool, link, newTab }) => {
    if (host === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to={`/hosts/${host.id}`}>
        <Icon icon='host' /> {host.name_label}
        {pool !== undefined && ` (${pool.name_label})`}
      </LinkWrapper>
    )
  },
])

Host.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
}

Host.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const Vm = decorate([
  connectStore(() => {
    const getVm = createGetObject()
    return {
      vm: getVm,
      container: createGetObject(
        createSelector(
          getVm,
          vm => get(() => vm.$container)
        )
      ),
    }
  }),
  ({ vm, container, link, newTab }) => {
    if (vm === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to={`/vms/${vm.id}`}>
        <Icon icon={`vm-${vm.power_state.toLowerCase()}`} /> {vm.name_label}
        {container !== undefined && ` (${container.name_label})`}
      </LinkWrapper>
    )
  },
])

Vm.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
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
    return (state, props) => ({
      // FIXME: props.self ugly workaround to get object as a self user
      template: getObject(state, props, props.self),
    })
  }),
  ({ template }) => {
    if (template === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <span>
        <Icon icon='vm' /> {template.name_label}
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
        sr => get(() => sr.$container)
      )
    )
    return (state, props) => ({
      // FIXME: props.self ugly workaround to get object as a self user
      sr: getSr(state, props, props.self),
      container: getContainer(state, props),
    })
  }),
  ({ sr, container, link, newTab }) => {
    if (sr === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to={`/srs/${sr.id}`}>
        <Icon icon='sr' /> {sr.name_label}
        {container !== undefined && (
          <span className='text-muted'> - {container.name_label}</span>
        )}
        {isSrWritable(sr) && (
          <span>{` (${formatSize(sr.size - sr.physical_usage)} free)`}</span>
        )}
      </LinkWrapper>
    )
  },
])

Sr.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
  self: PropTypes.bool,
}

Sr.defaultProps = {
  link: false,
  newTab: false,
  self: false,
}

@connectStore(() => {
  // true to bypass view permissions
  const getVdi = createGetObject()
  const getSr = createGetObject((state, props) => {
    const vdi = getVdi(state, props, true)
    return vdi && vdi.$SR
  })

  return (state, props) => ({
    sr: getSr(state, props),
    vdi: getVdi(state, props, true),
  })
})
export class VdiResourceSetItem extends Component {
  render () {
    const { props } = this
    const { sr, vdi } = props
    return (
      <XoItem item={vdi} {...props}>
        {() => (
          <span>
            <Icon icon='disk' /> {vdi.name_label}
            {sr !== undefined && (
              <span className='text-muted'> - {sr.name_label}</span>
            )}
          </span>
        )}
      </XoItem>
    )
  }
}

VdiResourceSetItem.propTypes = XO_ITEM_PROP_TYPES

// ===================================================================

export const Vdi = decorate([
  connectStore(() => {
    const getObject = createGetObject()
    const getSr = createGetObject((state, props) => {
     // true to bypass view permissions
     const vdi = getObject(state, props, true)
     return vdi && vdi.$SR
   })
    // FIXME: props.self ugly workaround to get object as a self user
    return (state, props) => ({
      vdi: getObject(state, props, props.self),
      sr: getSr(state, props)
    })
  }),
  ({ vdi }) => {
    if (vdi === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <span>
        <Icon icon='disk' /> {vdi.name_label}
        {sr !== undefined && (<span className='text-muted'> - {sr.name_label}</span>)}
      </span>
    )
  },
])

Vdi.propTypes = {
  id: PropTypes.string.isRequired,
  self: PropTypes.bool,
}

Vdi.defaultProps = {
  self: false,
}

// ===================================================================

export const Network = decorate([
  connectStore(() => {
    const getObject = createGetObject()
    // FIXME: props.self ugly workaround to get object as a self user
    return (state, props) => ({
      network: getObject(state, props, props.self),
    })
  }),
  ({ network }) => {
    if (network === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <span>
        <Icon icon='network' /> {network.name_label}
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
  ({ remote, link, newTab }) => {
    if (remote === undefined) {
      return UNKNOWN_ITEM // TODO: handle remotes not fetched yet
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
  role: role => <span>{role.name}</span>,
  user: user => (
    <span>
      <Icon icon='user' /> {user.email}
    </span>
  ),
  resourceSet: resourceSet => (
    <span>
      <strong>
        <Icon icon='resource-set' /> {resourceSet.name}
      </strong>{' '}
      ({resourceSet.id})
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

  // XO objects.
  pool: ({ id }) => <Pool id={id} />,

  VDI: ({ id }) => <Vdi id={id} />,
  'VDI-resourceSet': ({ id }) => <Vdi id={id} self />,

  // Pool objects.
  'VM-template': ({ id }) => <VmTemplate id={id} />,
  'VM-template-resourceSet': ({ id }) => <VmTemplate id={id} self />,
  host: ({ id }) => <Host id={id} />,
  network: ({ id }) => <Network id={id} />,
  'network-resourceSet': ({ id }) => <Network id={id} self />,

  // SR.
  SR: ({ id }) => <Sr id={id} />,
  'SR-resourceSet': ({ id }) => <Sr id={id} self />,

  // VM.
  VM: ({ id }) => <Vm id={id} />,
  'VM-snapshot': ({ id }) => <Vm id={id} />,
  'VM-controller': ({ id }) => (
    <span>
      <Icon icon='host' /> <Vm id={id} />
    </span>
  ),

  // PIF.
  PIF: pif => (
    <span>
      <Icon
        icon='network'
        color={pif.carrier ? 'text-success' : 'text-danger'}
      />{' '}
      {pif.device} ({pif.deviceName})
    </span>
  ),

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
      <Icon icon='gpu' /> {type.modelName} ({type.vendorName}){' '}
      {type.maxResolutionX}x{type.maxResolutionY}
    </span>
  ),

  gpuGroup: group => (
    <span>
      {startsWith(group.name_label, 'Group of ')
        ? group.name_label.slice(9)
        : group.name_label}
    </span>
  ),

  backup: backup => (
    <span>
      <span className='tag tag-info' style={{ textTransform: 'capitalize' }}>
        {backup.mode}
      </span>{' '}
      <span className='tag tag-warning'>{backup.remote.name}</span>{' '}
      <FormattedDate
        value={new Date(backup.timestamp)}
        month='long'
        day='numeric'
        year='numeric'
        hour='2-digit'
        minute='2-digit'
        second='2-digit'
      />
    </span>
  ),
}

const renderXoItem = (item, { className, type: xoType } = {}) => {
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
        <Component {...item} />
      </span>
    )
  }
}

export { renderXoItem as default }

export const getRenderXoItemOfType = type => (item, options = {}) =>
  renderXoItem(item, { ...options, type })

const GenericXoItem = connectStore(() => {
  const getObject = createGetObject()

  return (state, props) => ({
    xoItem: getObject(state, props),
  })
})(({ xoItem, ...props }) =>
  xoItem ? renderXoItem(xoItem, props) : renderXoUnknownItem()
)

export const renderXoItemFromId = (id, props) => (
  <GenericXoItem {...props} id={id} />
)

export const renderXoUnknownItem = () => (
  <span className='text-muted'>{_('errorNoSuchItem')}</span>
)
