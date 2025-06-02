import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import decorate from 'apply-decorators'
import Copiable from 'copiable'
import defined, { get } from '@xen-orchestra/defined'
import getEventValue from 'get-event-value'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import renderXoItem from 'render-xo-item'
import SelectBootFirmware from 'select-boot-firmware'
import SelectCoresPerSocket from 'select-cores-per-socket'
import semver from 'semver'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { error, success } from 'notification'
import { confirm } from 'modal'
import { Container, Row, Col } from 'grid'
import { CustomFields } from 'custom-fields'
import { injectState, provideState } from 'reaclette'
import { Number, Select as EditableSelect, Size, Text, XoSelect } from 'editable'
import { Select, Toggle } from 'form'
import { SelectResourceSet, SelectRole, SelectSubject, SelectUser, SelectVgpuType } from 'select-objects'
import { addSubscriptions, connectStore, formatSize, getVirtualizationModeLabel, osFamily } from 'utils'
import { every, filter, find, isEmpty, keyBy, map, times, some, uniq } from 'lodash'
import {
  addAcl,
  changeVirtualizationMode,
  cloneVm,
  convertVmToTemplate,
  createVgpu,
  createVtpm,
  createVusb,
  deleteVgpu,
  deleteVm,
  deleteVtpm,
  deleteVusb,
  editVm,
  getVmsHaValues,
  isPciPassthroughAvailable,
  isVmRunning,
  coalesceLeafVm,
  pauseVm,
  recoveryStartVm,
  removeAcl,
  restartVm,
  shareVm,
  startVm,
  stopVm,
  subscribeAcls,
  subscribeGroups,
  subscribeResourceSets,
  subscribeUsers,
  suspendVm,
  unplugVusb,
  vmAttachPcis,
  vmDetachPcis,
  vmSetUefiMode,
  vmWarmMigration,
  XEN_DEFAULT_CPU_CAP,
  XEN_DEFAULT_CPU_WEIGHT,
  XEN_VIDEORAM_VALUES,
} from 'xo'
import { createGetObject, createGetObjectsOfType, createSelector, isAdmin } from 'selectors'
import { getXoaPlan, CURRENT as XOA_PLAN, ENTERPRISE, PREMIUM } from 'xoa-plans'
import { SelectSuspendSr } from 'select-suspend-sr'

import BootOrder from './boot-order'
import VusbCreateModal from './vusb-create-modal'
import PciAttachModal from './pci-attach-modal'
import XenStoreCreateModal, { XENSTORE_PREFIX } from './xenstore-create-modal'
import { subscribeSecurebootReadiness, subscribeGetGuestSecurebootReadiness } from '../../common/xo'

// Button's height = react-select's height(36 px) + react-select's border-width(1 px) * 2
// https://github.com/JedWatson/react-select/blob/916ab0e62fc7394be8e24f22251c399a68de8b1c/less/select.less#L21, L22
const SHARE_BUTTON_STYLE = { height: '38px' }
const LEVELS = {
  admin: 'danger',
  operator: 'primary',
  viewer: 'success',
}

const STOP_OPERATIONS = [
  'clean_reboot',
  'clean_shutdown',
  'hard_reboot',
  'hard_shutdown',
  'pause',
  'suspend',

  // Even though it's not recognized by `xe (as of 2021-08), it's a valid operation
  'shutdown',
]

const VUSB_COLUMNS = [
  {
    name: _('id'),
    itemRenderer: vusb => {
      const { uuid } = vusb
      return (
        <Copiable data={uuid} tagName='p'>
          {uuid.slice(4, 8)}
        </Copiable>
      )
    },
  },
  {
    name: _('pusbDescription'),
    itemRenderer: (vusb, { pusbsByUsbGroup }) => pusbsByUsbGroup[vusb.usbGroup].description,
  },
  {
    name: _('pusbVersion'),
    itemRenderer: (vusb, { pusbsByUsbGroup }) => pusbsByUsbGroup[vusb.usbGroup].version,
  },
  {
    name: _('pusbSpeed'),
    itemRenderer: (vusb, { pusbsByUsbGroup }) => pusbsByUsbGroup[vusb.usbGroup].speed,
  },
  {
    name: _('status'),
    itemRenderer: ({ currentlyAttached, uuid }) => (
      <StateButton
        disabled={!currentlyAttached}
        disabledLabel={_('statusDisconnected')}
        disabledTooltip={_('vusbRemainUnplugged')}
        enabledLabel={_('connected')}
        enabledHandler={unplugVusb}
        enabledTooltip={_('vusbUnplugTooltip')}
        state={currentlyAttached}
        handlerParam={uuid}
      />
    ),
  },
]

const PCI_COLUMNS = [
  {
    name: _('id'),
    itemRenderer: (pciId, { pciByPciId }) => {
      const pci = pciByPciId[pciId]
      if (pci === undefined) {
        return _('unknown')
      }
      const { uuid } = pci
      return (
        <Copiable data={uuid} tagName='p'>
          {uuid.slice(4, 8)}
        </Copiable>
      )
    },
  },
  {
    default: true,
    name: _('pciId'),
    itemRenderer: pciId => pciId,
    sortCriteria: pciId => pciId,
  },
  {
    name: _('className'),
    itemRenderer: (pciId, { pciByPciId }) => {
      const pci = pciByPciId[pciId]
      return pci === undefined ? _('unknown') : pci.class_name
    },
    sortCriteria: (pciId, { pciByPciId }) => pciByPciId[pciId]?.class_name,
  },
  {
    name: _('deviceName'),
    itemRenderer: (pciId, { pciByPciId }) => {
      const pci = pciByPciId[pciId]
      return pci === undefined ? _('unknown') : pci.device_name
    },
    sortCriteria: (pciId, { pciByPciId }) => pciByPciId[pciId]?.device_name,
  },
]

const VUSB_INDIVIDUAL_ACTIONS = [
  {
    handler: deleteVusb,
    icon: 'delete',
    label: _('delete'),
    level: 'danger',
  },
]

const PCI_ACTIONS = [
  {
    handler: (pciIds, { vm }) => vmDetachPcis(vm, pciIds),
    icon: 'disconnect',
    label: _('detach'),
    level: 'danger',
  },
]

const SECUREBOOT_STATUS_MESSAGES = {
  disabled: _('secureBootNotEnforced'),
  first_boot: _('secureBootWantedPendingBoot'),
  ready: _('secureBootEnforced'),
  ready_no_dbx: _('secureBootNoDbx'),
  setup_mode: _('secureBootWantedButDisabled'),
  certs_incomplete: _('secureBootWantedButCertificatesMissing'),
}

const forceReboot = vm => restartVm(vm, true)
const forceShutdown = vm => stopVm(vm, true)
const fullCopy = vm => cloneVm(vm, true)
const shareVmProxy = vm => shareVm(vm, vm.resourceSet)

@connectStore(() => {
  const getAffinityHost = createGetObjectsOfType('host').find((_, { vm }) => ({
    id: vm.affinityHost,
  }))

  const getVbds = createGetObjectsOfType('VBD').pick((_, { vm }) => vm.$VBDs)
  const getVdis = createGetObjectsOfType('VDI').pick(createSelector(getVbds, vbds => map(vbds, 'VDI')))
  const getSrs = createGetObjectsOfType('SR').pick(createSelector(getVdis, vdis => uniq(map(vdis, '$SR'))))
  const getSrsContainers = createSelector(getSrs, srs => uniq(map(srs, '$container')))

  const getAffinityHostPredicate = createSelector(
    getSrsContainers,
    containers => host => every(containers, container => container === host.$pool || container === host.id)
  )

  return {
    affinityHost: getAffinityHost,
    affinityHostPredicate: getAffinityHostPredicate,
  }
})
class AffinityHost extends Component {
  _editAffinityHost = host => editVm(this.props.vm, { affinityHost: host.id || null })

  render() {
    const { affinityHost, affinityHostPredicate } = this.props

    return (
      <span>
        <XoSelect
          onChange={this._editAffinityHost}
          predicate={affinityHostPredicate}
          value={affinityHost}
          xoType='host'
        >
          {affinityHost ? renderXoItem(affinityHost) : _('noAffinityHost')}
        </XoSelect>{' '}
        {affinityHost && (
          <a role='button' onClick={this._editAffinityHost}>
            <Icon icon='remove' />
          </a>
        )}
      </span>
    )
  }
}

@addSubscriptions({
  resourceSets: subscribeResourceSets,
})
@connectStore({
  isAdmin,
})
class ResourceSet extends Component {
  _getResourceSet = createSelector(
    () => this.props.resourceSets,
    () => this.props.vm.resourceSet,
    (resourceSets, resourceSetId) => {
      const resourceSet = find(resourceSets, { id: resourceSetId })
      return resourceSet && Object.assign(resourceSet, { type: 'resourceSet' })
    }
  )

  render() {
    const resourceSet = this._getResourceSet()
    const { vm, isAdmin } = this.props

    return isAdmin ? (
      <div className='input-group'>
        <SelectResourceSet
          onChange={resourceSet =>
            editVm(vm, {
              resourceSet: resourceSet != null ? resourceSet.id : resourceSet,
            })
          }
          value={vm.resourceSet}
        />
        {resourceSet !== undefined && (
          <span className='input-group-btn'>
            <ActionButton
              btnStyle='primary'
              handler={shareVmProxy}
              handlerParam={vm}
              icon='vm-share'
              style={SHARE_BUTTON_STYLE}
              tooltip={_('vmShareButton')}
            />
          </span>
        )}
      </div>
    ) : vm.resourceSet === undefined ? (
      _('resourceSetNone')
    ) : resourceSet === undefined ? (
      _('errorUnknownItem', { type: 'resource set' })
    ) : (
      <span>
        {renderXoItem(resourceSet)}{' '}
        <ActionButton
          btnStyle='primary'
          handler={shareVmProxy}
          handlerParam={vm}
          icon='vm-share'
          size='small'
          tooltip={_('vmShareButton')}
        />
      </span>
    )
  }
}

class NewVgpu extends Component {
  get value() {
    return this.state
  }

  _getPredicate = createSelector(
    () => this.props.vm && this.props.vm.$pool,
    poolId => vgpuType => poolId === vgpuType.$pool
  )

  render() {
    return (
      <Container>
        <Row>
          <Col size={6}>{_('vmSelectVgpuType')}</Col>
          <Col size={6}>
            <SelectVgpuType onChange={this.linkState('vgpuType')} predicate={this._getPredicate()} />
          </Col>
        </Row>
      </Container>
    )
  }
}

class Vgpus extends Component {
  _createVgpu = vgpuType =>
    confirm({
      icon: 'gpu',
      title: _('vmAddVgpu'),
      body: <NewVgpu vm={this.props.vm} />,
    }).then(({ vgpuType }) => createVgpu(this.props.vm, { vgpuType, gpuGroup: vgpuType.gpuGroup }))

  render() {
    const { vgpus, vm } = this.props

    return (
      <div>
        {map(vgpus, vgpu => (
          <span key={vgpu.id} className='mb-1'>
            {!isVmRunning(vm) && <ActionButton handler={deleteVgpu} handlerParam={vgpu} icon='delete' size='small' />}{' '}
            {renderXoItem(vgpu)}
          </span>
        ))}
        {isEmpty(vgpus) && (
          <span>
            {!isVmRunning(vm) && <ActionButton handler={this._createVgpu} icon='add' size='small' />} {_('vmVgpuNone')}
          </span>
        )}
      </div>
    )
  }
}

class CoresPerSocket extends Component {
  _onChange = coresPerSocket => editVm(this.props.vm, { coresPerSocket })

  render() {
    const { container, vm } = this.props
    const { coresPerSocket, CPUs: cpus } = vm

    return (
      <div>
        {container != null ? (
          <SelectCoresPerSocket
            maxCores={container.cpus.cores}
            maxVcpus={cpus.max}
            onChange={this._onChange}
            value={coresPerSocket}
          />
        ) : coresPerSocket !== undefined ? (
          _('vmSocketsWithCoresPerSocket', {
            nSockets: cpus.max / coresPerSocket,
            nCores: coresPerSocket,
          })
        ) : (
          _('vmCoresPerSocketNone')
        )}
      </div>
    )
  }
}

class AddAclsModal extends Component {
  get value() {
    return this.state
  }

  _getPredicate = createSelector(
    () => this.props.acls,
    () => this.props.vm,
    (acls, object) =>
      ({ id: subject, permission }) =>
        permission !== 'admin' && !some(acls, { object, subject })
  )

  render() {
    const { action, subjects } = this.state
    return (
      <form>
        <div className='form-group'>
          <SelectSubject
            multi
            onChange={this.linkState('subjects')}
            predicate={this._getPredicate()}
            value={subjects}
          />
        </div>
        <div className='form-group'>
          <SelectRole onChange={this.linkState('action')} value={action} />
        </div>
      </form>
    )
  }
}

const Acls = decorate([
  addSubscriptions({
    acls: subscribeAcls,
    groups: cb => subscribeGroups(groups => cb(keyBy(groups, 'id'))),
    users: cb => subscribeUsers(users => cb(keyBy(users, 'id'))),
  }),
  provideState({
    effects: {
      addAcls:
        () =>
        (state, { acls, vm }) =>
          confirm({
            title: _('vmAddAcls'),
            icon: 'menu-settings-acls',
            body: <AddAclsModal acls={acls} vm={vm} />,
          })
            .then(async ({ action, subjects }) => {
              if (action == null || isEmpty(subjects)) {
                error(_('addAclsErrorTitle'), _('addAclsErrorMessage'))
                return
              }

              await Promise.all(map(subjects, subject => addAcl({ subject, object: vm, action })))
            })
            .catch(err => err && error(_('addAclsErrorTitle'), err.message || String(err))),
      removeAcl:
        (_, { currentTarget: { dataset } }) =>
        (_, { vm: object }) =>
          removeAcl({
            action: dataset.action,
            object,
            subject: dataset.subject,
          }),
    },
    computed: {
      rawAcls: (_, { acls, vm }) => filter(acls, { object: vm }),
      resolvedAcls: ({ rawAcls }, { users, groups }) => {
        if (users === undefined || groups === undefined) {
          return []
        }
        return rawAcls
          .map(({ subject, ...acl }) => ({
            ...acl,
            subject: defined(users[subject], groups[subject]),
          }))
          .filter(({ subject }) => subject !== undefined)
      },
    },
  }),
  injectState,
  ({ state: { resolvedAcls }, effects, vm }) => (
    <Container>
      {resolvedAcls.slice(0, 5).map(({ subject, action }) => (
        <Row key={`${subject.id}.${action}`}>
          <Col>
            <span>{renderXoItem(subject)}</span> <span className={`tag tag-pill tag-${LEVELS[action]}`}>{action}</span>{' '}
            <Tooltip content={_('removeAcl')}>
              <a data-action={action} data-subject={subject.id} onClick={effects.removeAcl} role='button'>
                <Icon icon='remove' />
              </a>
            </Tooltip>
          </Col>
        </Row>
      ))}
      {resolvedAcls.length > 5 && (
        <Row>
          <Col>
            <Link to={`settings/acls?s=object:${vm}`}>{_('moreAcls', { nAcls: resolvedAcls.length - 5 })}</Link>
          </Col>
        </Row>
      )}
      <Row>
        <Col>
          <ActionButton
            btnStyle='primary'
            disabled={XOA_PLAN.value < ENTERPRISE.value}
            handler={effects.addAcls}
            icon='add'
            size='small'
            tooltip={
              XOA_PLAN.value < ENTERPRISE.value ? _('availableXoaPlan', { plan: ENTERPRISE.name }) : _('vmAddAcls')
            }
          />
        </Col>
      </Row>
    </Container>
  ),
])

const NIC_TYPE_OPTIONS = [
  {
    label: 'Realtek RTL8139',
    value: '',
  },
  {
    label: 'Intel e1000',
    value: 'e1000',
  },
]

@addSubscriptions(({ vm }) => ({
  vmSecurebootReadiness: subscribeSecurebootReadiness(vm),
  poolGuestSecurebootReadiness: subscribeGetGuestSecurebootReadiness(vm.$pool),
}))
@connectStore(() => {
  const getVgpus = createGetObjectsOfType('vgpu').pick((_, { vm }) => vm.$VGPUs)
  const getGpuGroup = createGetObjectsOfType('gpuGroup').pick(createSelector(getVgpus, vgpus => map(vgpus, 'gpuGroup')))
  const getVusbs = createGetObjectsOfType('VUSB').filter(
    (_, { vm }) =>
      vusb =>
        vusb.vm === vm.id
  )
  const getPcisbByHost = createGetObjectsOfType('PCI').groupBy('$host')
  const getPusbs = createGetObjectsOfType('PUSB')
  const getAvailablePusbs = getPusbs
    .pick(
      createSelector(createGetObjectsOfType('USB_group'), usbGroups =>
        map(
          filter(usbGroups, usbGroup => usbGroup.VUSBs[0] === undefined),
          usbGroup => usbGroup.PUSBs
        )
      )
    )
    .sort()
  const getVmHosts = createGetObjectsOfType('host').filter(
    (_, { vm }) =>
      host =>
        host.$pool === vm.$pool
  )

  return (state, props) => ({
    availablePusbs: getAvailablePusbs(state, props),
    gpuGroup: getGpuGroup(state, props),
    isAdmin: isAdmin(state, props),
    vgpus: getVgpus(state, props),
    vmPool: createGetObject((_, props) => get(() => props.vm.$pool))(state, props),
    pcisByHost: getPcisbByHost(state, props),
    pusbByUsbGroup: keyBy(getPusbs(state, props), 'usbGroup'),
    vmHosts: getVmHosts(state, props),
    vusbs: getVusbs(state, props),
  })
})
export default class TabAdvanced extends Component {
  componentDidMount() {
    getVmsHaValues().then(vmsHaValues => this.setState({ vmsHaValues }))
  }

  _getCpuMaskOptions = createSelector(
    () => this.props.vmHosts,
    vmHosts => {
      return times(Math.max(...Object.values(this.props.vmHosts).map(({ cpus }) => cpus.cores)), number => ({
        value: number,
        label: `Core ${number}`,
      }))
    }
  )

  _getCpuMask = createSelector(
    this._getCpuMaskOptions,
    () => this.props.vm.cpuMask,
    (options, cpuMask) => (cpuMask !== undefined ? options.filter(({ value }) => cpuMask.includes(value)) : undefined)
  )

  _getIsStopBlocked = createSelector(
    () => this.props.vm && this.props.vm.blockedOperations,
    blockedOperations => STOP_OPERATIONS.every(op => op in blockedOperations)
  )

  _getIsMigrationBlocked = createSelector(
    () => this.props.vm?.blockedOperations,
    blockedOperations =>
      blockedOperations !== undefined && ['migrate_send', 'pool_migrate'].some(op => op in blockedOperations)
  )

  _onChangeBlockMigration = block => {
    const blockedOperations = this.props.vm.blockedOperations

    const toggleBlockedOperations = () =>
      editVm(this.props.vm, {
        blockedOperations: Object.assign.apply(
          null,
          ['migrate_send', 'pool_migrate'].map(op => ({ [op]: block ? true : null }))
        ),
      })

    if (
      blockedOperations !== undefined &&
      ['migrate_send', 'pool_migrate'].some(op => op in blockedOperations && blockedOperations[op].trim() !== 'true')
    ) {
      return confirm({
        title: _('unblockMigrationTitle'),
        body: (
          <p>
            {_('unblockMigrationConfirm')}
            <ul>
              {Object.keys(blockedOperations).map(op => {
                const reason = blockedOperations[op]
                if ((op === 'migrate_send' || op === 'pool_migrate') && reason.trim() !== 'true') {
                  return <li key={op}>{reason}</li>
                }
                return null
              })}
            </ul>
          </p>
        ),
      }).then(() => toggleBlockedOperations())
    } else {
      return toggleBlockedOperations()
    }
  }

  _onChangeBlockStop = block =>
    editVm(this.props.vm, {
      blockedOperations: Object.assign.apply(
        null,
        STOP_OPERATIONS.map(op => ({ [op]: block }))
      ),
    })

  _onChangeCpuMask = cpuMask => editVm(this.props.vm, { cpuMask: map(cpuMask, 'value') })

  _handleBootFirmware = value =>
    editVm(this.props.vm, {
      secureBoot: false,
      hvmBootFirmware: value !== '' ? value : null,
    })

  _onNicTypeChange = value => editVm(this.props.vm, { nicType: value === '' ? null : value })

  _getDisabledAddVtpmReason = createSelector(
    () => this.props.vm,
    () => this.props.pool,
    (vm, pool) => {
      if (pool?.vtpmSupported === false) {
        return _('vtpmNotSupported')
      }
      if (vm.boot.firmware !== 'uefi') {
        return _('vtpmRequireUefi')
      }
      if (vm.power_state !== 'Halted') {
        return _('vmNeedToBeHalted')
      }
    }
  )

  _getDisabledDeleteVtpmReason = () => {
    if (this.props.vm.power_state !== 'Halted') {
      return _('vmNeedToBeHalted')
    }
  }

  _handleDeleteVtpm = async vtpm => {
    await confirm({
      icon: 'delete',
      title: _('deleteVtpm'),
      body: <p>{_('deleteVtpmWarning')}</p>,
      strongConfirm: {
        messageId: 'deleteVtpm',
      },
    })
    return deleteVtpm(vtpm)
  }

  _updateUser = user => editVm(this.props.vm, { creation: { user: user.id } })

  _createVusb = async () => {
    const pusb = await confirm({
      title: _('createVusb'),
      body: <VusbCreateModal pusbs={this.props.availablePusbs} />,
      icon: 'add',
    })
    return createVusb(this.props.vm, pusb.usbGroup)
  }

  _attachPcis = async () => {
    const { vm, vmPool } = this.props
    const pcis = await confirm({
      body: (
        <PciAttachModal attachedPciIds={vm.attachedPcis} pcisByHost={this.props.pcisByHost} vm={vm} pool={vmPool} />
      ),
      icon: 'add',
      title: _('attachPcis'),
    })
    await vmAttachPcis(vm, pcis)
  }

  _getPcis = createSelector(
    () => this.props.vm,
    () => this.props.pcisByHost,
    (vm, pcisByHost) => {
      if (!isVmRunning(vm) && vm.power_state !== 'Paused') {
        // If the VM is not running, it's not attached to any host, therefore,
        // we cannot determine which XAPI PCI object is associated with the given PCI_ID (eg: 0000:01:00.4).
        // This determination depends on the specific host environment.
        return {}
      }
      return keyBy(pcisByHost[vm.$container], 'pci_id')
    }
  )

  _getPciAttachButtonTooltip = () => {
    const { vm, vmHosts, vmPool } = this.props
    const vmAttachedToHost = vm.$container !== vm.$pool

    if ((vmAttachedToHost && vmHosts[vm.$container] === undefined) || (!vmAttachedToHost && vmPool === undefined)) {
      return _('notEnoughPermissionsError')
    }

    return !isPciPassthroughAvailable(vmHosts[vmAttachedToHost ? vm.$container : vmPool.master])
      ? _('onlyAvailableXcp8.3OrHigher')
      : undefined
  }

  _confirmUefiMode = async () => {
    const { vm, vmSecurebootReadiness } = this.props
    const confirmNeeded =
      vmSecurebootReadiness === 'disabled' ||
      vmSecurebootReadiness === 'ready' ||
      vmSecurebootReadiness === 'ready_no_dbx'

    if (confirmNeeded) {
      await confirm({
        title: _('propagateCertificatesTitle'),
        body: <p>{_('propagateCertificatesConfirm')}</p>,
      })
    }

    await vmSetUefiMode(vm, 'user')
    success(_('propagateCertificatesTitle'), _('propagateCertificatesSuccessful'))
  }

  _addXenstoreEntry = async () => {
    const xsEntry = await confirm({
      title: _('addXenStoreEntry'),
      icon: 'add',
      body: <XenStoreCreateModal />,
    })
    if (xsEntry === undefined) {
      return
    }

    await editVm(this.props.vm, { xenStoreData: xsEntry })
  }

  _getOnChangeXenStoreEntry = key => async value => {
    value = value.trim()
    await editVm(this.props.vm, {
      xenStoreData: { [key]: value === '' ? null : value },
    })
  }

  _getXenStoreData = createSelector(
    () => this.props.vm,
    vm =>
      Object.entries(vm.xenStoreData)
        .filter(([key]) => key.startsWith(XENSTORE_PREFIX))
        .sort()
  )

  render() {
    const {
      container,
      isAdmin,
      poolGuestSecurebootReadiness,
      pusbByUsbGroup,
      vgpus,
      vm,
      vmPool,
      vmSecurebootReadiness,
      vusbs,
    } = this.props
    const isWarmMigrationAvailable = getXoaPlan().value >= PREMIUM.value
    const addVtpmTooltip = this._getDisabledAddVtpmReason()
    const deleteVtpmTooltip = this._getDisabledDeleteVtpmReason()
    const host = this.props.vmHosts[vm.$container]
    const isAddVtpmAvailable = addVtpmTooltip === undefined
    const isDeleteVtpmAvailable = deleteVtpmTooltip === undefined
    const isDisabled = poolGuestSecurebootReadiness === 'not_ready' || vm.boot.firmware !== 'uefi'
    const vtpmId = vm.VTPMs[0]
    const pciAttachButtonTooltip = this._getPciAttachButtonTooltip()
    const xenstoreData = this._getXenStoreData()

    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            {vm.power_state === 'Running' && (
              <span>
                <TabButton
                  btnStyle='primary'
                  handler={pauseVm}
                  handlerParam={vm}
                  icon='vm-pause'
                  labelId='pauseVmLabel'
                />
                <TabButton
                  btnStyle='primary'
                  handler={suspendVm}
                  handlerParam={vm}
                  icon='vm-suspend'
                  labelId='suspendVmLabel'
                />
                <TabButton
                  btnStyle='primary'
                  handler={coalesceLeafVm}
                  handlerParam={vm}
                  icon='vm-coalesce-leaf'
                  labelId='coalesceLeaf'
                />
                <TabButton
                  btnStyle='warning'
                  handler={forceReboot}
                  handlerParam={vm}
                  icon='vm-force-reboot'
                  labelId='forceRebootVmLabel'
                />
                <TabButton
                  btnStyle='warning'
                  handler={forceShutdown}
                  handlerParam={vm}
                  icon='vm-force-shutdown'
                  labelId='forceShutdownVmLabel'
                />
                <TabButton
                  btnStyle='warning'
                  disabled={!isWarmMigrationAvailable}
                  handler={vmWarmMigration}
                  handlerParam={vm}
                  icon='vm-warm-migration'
                  labelId='vmWarmMigration'
                  tooltip={isWarmMigrationAvailable ? undefined : _('availableXoaPremium')}
                />
              </span>
            )}
            {vm.power_state === 'Halted' && (
              <span>
                <TabButton
                  btnStyle='primary'
                  handler={recoveryStartVm}
                  handlerParam={vm}
                  icon='vm-recovery-mode'
                  labelId='recoveryModeLabel'
                />
                <TabButton
                  btnStyle='primary'
                  handler={() => startVm(vm, true)}
                  icon='vm-start'
                  labelId='startVmOnLabel'
                />
                <TabButton
                  btnStyle='primary'
                  handler={fullCopy}
                  handlerParam={vm}
                  icon='vm-clone'
                  labelId='cloneVmLabel'
                />
                <TabButton
                  btnStyle='primary'
                  handler={coalesceLeafVm}
                  handlerParam={vm}
                  icon='vm-coalesce-leaf'
                  labelId='coalesceLeaf'
                />
              </span>
            )}
            {vm.power_state === 'Suspended' && (
              <span>
                <TabButton
                  btnStyle='primary'
                  handler={startVm}
                  handlerParam={vm}
                  icon='vm-start'
                  labelId='resumeVmLabel'
                />
                <TabButton
                  btnStyle='primary'
                  handler={coalesceLeafVm}
                  handlerParam={vm}
                  icon='vm-coalesce-leaf'
                  labelId='coalesceLeaf'
                />
                <TabButton
                  btnStyle='warning'
                  handler={forceShutdown}
                  handlerParam={vm}
                  icon='vm-force-shutdown'
                  labelId='forceShutdownVmLabel'
                />
              </span>
            )}
            {vm.power_state === 'Paused' && (
              <span>
                <TabButton
                  btnStyle='primary'
                  handler={startVm}
                  handlerParam={vm}
                  icon='vm-start'
                  labelId='resumeVmLabel'
                />
                <TabButton
                  btnStyle='warning'
                  handler={forceReboot}
                  handlerParam={vm}
                  icon='vm-force-reboot'
                  labelId='forceRebootVmLabel'
                />
                <TabButton
                  btnStyle='warning'
                  handler={forceShutdown}
                  handlerParam={vm}
                  icon='vm-force-shutdown'
                  labelId='forceShutdownVmLabel'
                />
              </span>
            )}
            <TabButton
              btnStyle='danger'
              disabled={vm.power_state !== 'Halted'}
              handler={convertVmToTemplate}
              handlerParam={vm}
              icon='vm-create-template'
              labelId='vmConvertToTemplateButton'
              redirectOnSuccess='/'
            />
            <TabButton
              btnStyle='danger'
              handler={deleteVm}
              handlerParam={vm}
              icon='vm-delete'
              labelId='vmRemoveButton'
            />
          </Col>
        </Row>
        {vm.virtualizationMode !== 'pv' && (
          <Row>
            <Col>
              <h3>{_('vdiBootOrder')}</h3>
              <BootOrder vm={vm} />
            </Col>
          </Row>
        )}
        <Row>
          <Col>
            <h3>{_('xenSettingsLabel')}</h3>
            <table className='table'>
              <tbody>
                <tr>
                  <th>{_('virtualizationMode')}</th>
                  <td>
                    {getVirtualizationModeLabel(vm)}{' '}
                    {(vm.virtualizationMode === 'pv' || vm.virtualizationMode === 'hvm') && (
                      <ActionButton
                        btnStyle='danger'
                        disabled={vm.power_state !== 'Halted'}
                        handler={changeVirtualizationMode}
                        handlerParam={vm}
                        icon='vm-migrate'
                        size='small'
                      >
                        {_('vmSwitchVirtualizationMode', {
                          mode: vm.virtualizationMode === 'pv' ? 'HVM' : 'PV',
                        })}
                      </ActionButton>
                    )}
                  </td>
                </tr>
                {vm.virtualizationMode === 'pv' && (
                  <tr>
                    <th>{_('pvArgsLabel')}</th>
                    <td>
                      <Text value={vm.PV_args} onChange={value => editVm(vm, { PV_args: value })} />
                    </td>
                  </tr>
                )}
                <tr>
                  <th>{_('startDelayLabel')}</th>
                  <td>
                    <Number value={vm.startDelay} onChange={value => editVm(vm, { startDelay: value })} />
                  </td>
                </tr>
                <tr>
                  <th>{_('cpuMaskLabel')}</th>
                  <td>
                    <EditableSelect
                      multi
                      onChange={this._onChangeCpuMask}
                      options={this._getCpuMaskOptions()}
                      placeholder={_('selectCpuMask')}
                      value={this._getCpuMask()}
                    />
                  </td>
                </tr>
                <tr>
                  <th>{_('cpuWeightLabel')}</th>
                  <td>
                    <Number
                      value={vm.cpuWeight == null ? null : vm.cpuWeight}
                      onChange={value => editVm(vm, { cpuWeight: value })}
                      nullable
                    >
                      {vm.cpuWeight == null
                        ? _('defaultCpuWeight', {
                            value: XEN_DEFAULT_CPU_WEIGHT,
                          })
                        : vm.cpuWeight}
                    </Number>
                  </td>
                </tr>
                <tr>
                  <th>{_('cpuCapLabel')}</th>
                  <td>
                    <Number
                      value={vm.cpuCap == null ? null : vm.cpuCap}
                      onChange={value => editVm(vm, { cpuCap: value })}
                      nullable
                    >
                      {vm.cpuCap == null ? _('defaultCpuCap', { value: XEN_DEFAULT_CPU_CAP }) : vm.cpuCap}
                    </Number>
                  </td>
                </tr>
                <tr>
                  <th>
                    {_('autoPowerOn')}
                    {vm.auto_poweron && vmPool !== undefined && !vmPool.auto_poweron && (
                      <Tooltip content={_('poolAutoPoweronDisabled')}>
                        <a className='btn btn-link btn-sm' onClick={() => editVm(vm, { auto_poweron: true })}>
                          {' '}
                          <Icon icon='alarm' className='text-warning' />
                        </a>
                      </Tooltip>
                    )}
                  </th>
                  <td>
                    <Toggle value={Boolean(vm.auto_poweron)} onChange={value => editVm(vm, { auto_poweron: value })} />
                  </td>
                </tr>
                <tr>
                  <th>{_('protectFromDeletion')}</th>
                  <td>
                    <Toggle
                      value={'destroy' in vm.blockedOperations}
                      onChange={blockDeletion =>
                        editVm(vm, {
                          blockedOperations: { destroy: blockDeletion },
                        })
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <th>{_('protectFromShutdown')}</th>
                  <td>
                    <Toggle value={this._getIsStopBlocked()} onChange={this._onChangeBlockStop} />
                  </td>
                </tr>
                <tr>
                  <th>{_('blockMigration')}</th>
                  <td>
                    <Toggle value={this._getIsMigrationBlocked()} onChange={this._onChangeBlockMigration} />
                  </td>
                </tr>
                <tr>
                  <th>{_('windowsUpdateTools')}</th>
                  <td>
                    <Toggle value={vm.hasVendorDevice} onChange={value => editVm(vm, { hasVendorDevice: value })} />
                  </td>
                </tr>
                {vm.virtualizationMode === 'hvm' && (
                  <tr>
                    <th>
                      {_('nestedVirt')}{' '}
                      <Tooltip content={_('nestedVirtualizationWarning')}>
                        <a
                          href='https://docs.xcp-ng.org/compute/#-nested-virtualization'
                          target='_blank'
                          rel='noreferrer'
                        >
                          <Icon icon='alarm' className='text-warning' />
                        </a>
                      </Tooltip>
                    </th>
                    <td>
                      <Toggle
                        disabled={vm.power_state !== 'Halted'}
                        value={vm.isNestedVirtEnabled}
                        onChange={value => {
                          if (semver.satisfies(String(vmPool.platform_version), '>=3.4')) {
                            editVm(vm, { nestedVirt: value })
                          } else {
                            editVm(vm, { expNestedHvm: value })
                          }
                        }}
                      />
                    </td>
                  </tr>
                )}
                <tr>
                  <th>{_('ha')}</th>
                  <td>
                    <select
                      className='form-control'
                      onChange={event => editVm(vm, { high_availability: getEventValue(event) })}
                      value={vm.high_availability}
                    >
                      {map(this.state.vmsHaValues, vmsHaValue => (
                        <option key={vmsHaValue} value={vmsHaValue}>
                          {vmsHaValue === '' ? _('vmHaDisabled') : vmsHaValue}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <th>{_('vmAffinityHost')}</th>
                  <td>
                    <AffinityHost vm={vm} />
                  </td>
                </tr>
                {vm.virtualizationMode === 'hvm' && (
                  <tr>
                    <th>{_('vmVgpus')}</th>
                    <td>
                      <Vgpus vgpus={vgpus} vm={vm} />
                    </td>
                  </tr>
                )}
                <tr>
                  <th>{_('vmNicType')}</th>
                  <td>
                    <Select
                      labelKey='label'
                      onChange={this._onNicTypeChange}
                      options={NIC_TYPE_OPTIONS}
                      required
                      simpleValue
                      value={vm.nicType || ''}
                      valueKey='value'
                    />
                  </td>
                </tr>
                {vm.virtualizationMode === 'hvm' && (
                  <tr>
                    <th>{_('vmVga')}</th>
                    <td>
                      <Toggle
                        value={vm.vga === 'std'}
                        onChange={value => editVm(vm, { vga: value ? 'std' : 'cirrus' })}
                      />
                    </td>
                  </tr>
                )}
                {vm.vga === 'std' && (
                  <tr>
                    <th>{_('vmVideoram')}</th>
                    <td>
                      <select
                        className='form-control'
                        onChange={event => editVm(vm, { videoram: +getEventValue(event) })}
                        value={vm.videoram}
                      >
                        {map(XEN_VIDEORAM_VALUES, val => (
                          <option key={val} value={val}>
                            {formatSize(val * 1048576)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )}
                {vm.virtualizationMode === 'hvm' && (
                  <tr>
                    <th>{_('vmBootFirmware')}</th>
                    <td>
                      <SelectBootFirmware
                        host={vm.power_state === 'Running' ? vm.$container : get(() => vmPool.master)}
                        onChange={this._handleBootFirmware}
                        value={defined(() => vm.boot.firmware, '')}
                      />
                      {/**
                       * Templates report UEFI is not supported
                       * See https://xcp-ng.org/forum/post/76412
                       */}
                      {vm.boot.firmware !== 'uefi' && !vm.isFirmwareSupported && (
                        <span className='text-danger font-weight-bold'>
                          <Icon icon='error' /> {_('firmwareNotSupported')}
                        </span>
                      )}
                    </td>
                  </tr>
                )}
                <tr>
                  <th>{_('secureBoot')}</th>
                  <td>
                    <Tooltip content={vm.boot.firmware !== 'uefi' ? _('availableForUefiOnly') : undefined}>
                      <Toggle
                        disabled={vm.boot.firmware !== 'uefi'}
                        value={vm.secureBoot}
                        onChange={value => editVm(vm, { secureBoot: value })}
                      />
                    </Tooltip>
                    <a
                      className='text-muted'
                      href='https://xcp-ng.org/docs/guides.html#guest-uefi-secure-boot'
                      rel='noreferrer'
                      style={{ display: 'block' }}
                      target='_blank'
                    >
                      <Icon icon='info' /> {_('secureBootLinkToDocumentationMessage')}
                    </a>
                  </td>
                </tr>
                {vm.boot.firmware === 'uefi' &&
                  semver.satisfies(host?.version, '>=8.3.0') && [
                    <tr key='secureBootStatus'>
                      <th>{_('secureBootStatus')}</th>
                      <td>
                        {SECUREBOOT_STATUS_MESSAGES[vmSecurebootReadiness]}
                        {(vmSecurebootReadiness === 'setup_mode' ||
                          vmSecurebootReadiness === 'certs_incomplete' ||
                          vmSecurebootReadiness === 'ready_no_dbx') &&
                          host?.productBrand === 'XCP-ng' && (
                            <a
                              className='text-warning'
                              href='https://docs.xcp-ng.org/guides/guest-UEFI-Secure-Boot/#troubleshoot-guest-secure-boot-issues'
                              rel='noreferrer'
                              style={{ display: 'block' }}
                              target='_blank'
                            >
                              <Icon icon='alarm' /> {_('secureBootLinkToDocumentationMessage')}
                            </a>
                          )}
                      </td>
                    </tr>,
                    <tr key='propagateCertificatesButton'>
                      <th>{_('propagateCertificatesTitle')} </th>
                      <td>
                        <ActionButton
                          btnStyle='primary'
                          disabled={isDisabled}
                          handler={this._confirmUefiMode}
                          icon='vm-clone'
                        >
                          {_('propagateCertificates')}
                        </ActionButton>
                        {poolGuestSecurebootReadiness === 'not_ready' && (
                          <a
                            className='text-warning'
                            href='https://docs.xcp-ng.org/guides/guest-UEFI-Secure-Boot/#configure-the-pool'
                            rel='noreferrer'
                            style={{ display: 'block' }}
                            target='_blank'
                          >
                            <Icon icon='alarm' /> {_('noSecureBoot')}
                          </a>
                        )}
                      </td>
                    </tr>,
                  ]}
                <tr>
                  <th>{_('vtpm')}</th>
                  <td>
                    {/*
                    FIXME: add documentation link
                    <a
                      className='text-muted'
                      href='#'
                      rel='noopener noreferrer'
                      style={{ display: 'block' }}
                      target='_blank'
                    >
                      <Icon icon='info' /> {_('seeVtpmDocumentation')}
                    </a> */}
                    {vtpmId == null ? (
                      <Tooltip content={addVtpmTooltip}>
                        <ActionButton
                          btnStyle='primary'
                          disabled={!isAddVtpmAvailable}
                          handler={createVtpm}
                          handlerParam={vm}
                          icon='add'
                        >
                          {_('createVtpm')}
                        </ActionButton>
                      </Tooltip>
                    ) : (
                      <div>
                        <Tooltip content={deleteVtpmTooltip}>
                          <ActionButton
                            btnStyle='danger'
                            disabled={!isDeleteVtpmAvailable}
                            handler={this._handleDeleteVtpm}
                            handlerParam={vtpmId}
                            icon='delete'
                          >
                            {_('deleteVtpm')}
                          </ActionButton>
                        </Tooltip>
                        <table className='table mt-1'>
                          <tbody>
                            <tr>
                              <th>{_('uuid')}</th>
                              <Copiable tagName='td' data={vtpmId}>
                                {vtpmId.slice(0, 4)}
                              </Copiable>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{_('customFields')}</th>
                  <td>
                    <CustomFields object={vm.id} />
                  </td>
                </tr>
                <tr>
                  <th>{_('suspendSr')}</th>
                  <td>
                    <SelectSuspendSr vm={vm} />
                  </td>
                </tr>
                <tr>
                  <th>{_('viridian')}</th>
                  <td>
                    <Toggle value={vm.viridian} onChange={value => editVm(vm, { viridian: value })} />
                  </td>
                </tr>
              </tbody>
            </table>
            <br />
            <h3>{_('xenStore')}</h3>
            <div className='text-info'>
              <i className='d-block'>
                <Icon icon='info' /> {_('rebootRequiredAfterXenStoreChanges')}
              </i>
              <i className='d-block'>
                <Icon icon='info' /> {_('deleteEntryDeleteValue')}
              </i>
            </div>
            <br />
            <ActionButton btnStyle='primary' handler={this._addXenstoreEntry} icon='add'>
              {_('addXenStoreEntry')}
            </ActionButton>
            <table className='mt-1 table table-hover'>
              <tbody>
                {xenstoreData.map(([key, value]) => (
                  <tr key={key}>
                    <th>{key}</th>
                    <td>
                      <Text value={value} onChange={this._getOnChangeXenStoreEntry(key)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <br />
            <h3>{_('vmLimitsLabel')}</h3>
            <table className='table table-hover'>
              <tbody>
                <tr>
                  <th>{_('vmCpuLimitsLabel')}</th>
                  <td>
                    <Number value={vm.CPUs.number} onChange={CPUs => editVm(vm, { CPUs })} />/
                    {vm.power_state === 'Running' ? (
                      vm.CPUs.max
                    ) : (
                      <Number value={vm.CPUs.max} onChange={cpusMax => editVm(vm, { cpusMax })} />
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{_('vmCpuTopology')}</th>
                  <td>
                    <CoresPerSocket container={container} vm={vm} />
                  </td>
                </tr>
                <tr>
                  <th>{_('vmMemoryLimitsLabel')}</th>
                  <td>
                    <p>
                      Static: {formatSize(vm.memory.static[0])}/
                      <Size
                        value={defined(vm.memory.static[1], null)}
                        onChange={memoryStaticMax => editVm(vm, { memoryStaticMax })}
                      />
                    </p>
                    <p>
                      Dynamic:{' '}
                      <Size
                        value={defined(vm.memory.dynamic[0], null)}
                        onChange={memoryMin => editVm(vm, { memoryMin })}
                      />
                      /
                      <Size
                        value={defined(vm.memory.dynamic[1], null)}
                        onChange={memoryMax => editVm(vm, { memoryMax })}
                      />
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <br />
            <h3>{_('guestOsLabel')}</h3>
            <table className='table table-hover'>
              <tbody>
                <tr>
                  <th>{_('managementAgentVersion')}</th>
                  <td>{defined(vm.pvDriversVersion, _('unknown'))}</td>
                </tr>
                <tr>
                  <th>{_('osName')}</th>
                  <td>
                    {isEmpty(vm.os_version) ? (
                      _('unknownOsName')
                    ) : (
                      <span>
                        <Icon className='text-info' icon={osFamily(vm.os_version.distro)} />
                        &nbsp;
                        {vm.os_version.name}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{_('osKernel')}</th>
                  <td>{(vm.os_version && vm.os_version.uname) || _('unknownOsKernel')}</td>
                </tr>
              </tbody>
            </table>
            <br />
            <h3>{_('vusbs')}</h3>
            <ActionButton btnStyle='primary' handler={this._createVusb} icon='add'>
              {_('createVusb')}
            </ActionButton>
            <SortedTable
              collection={vusbs}
              columns={VUSB_COLUMNS}
              data-pusbsByUsbGroup={pusbByUsbGroup}
              individualActions={VUSB_INDIVIDUAL_ACTIONS}
            />
            <br />
            <h3>{_('attachedPcis')}</h3>
            <div className='text-info'>
              <i className='d-block'>
                <Icon icon='info' /> {_('infoUnknownPciOnNonRunningVm')}
              </i>
              <i className='d-block'>
                <Icon icon='info' /> {_('attachingDetachingPciNeedVmBoot')}
              </i>
            </div>
            <ActionButton
              btnStyle='primary'
              disabled={pciAttachButtonTooltip !== undefined}
              handler={this._attachPcis}
              icon='connect'
              tooltip={pciAttachButtonTooltip}
            >
              {_('attachPcis')}
            </ActionButton>
            <SortedTable
              actions={PCI_ACTIONS}
              collection={vm.attachedPcis}
              columns={PCI_COLUMNS}
              data-pciByPciId={this._getPcis()}
              data-vm={vm}
              stateUrlParam='s_pcis'
            />
            <br />
            <h3>{_('miscLabel')}</h3>
            <table className='table table-hover'>
              <tbody>
                <tr>
                  <th>{_('resourceSet')}</th>
                  <td>
                    <ResourceSet vm={vm} />
                  </td>
                </tr>
                {isAdmin && (
                  <tr>
                    <th>{_('vmAcls')}</th>
                    <td>
                      <Acls vm={vm.id} />
                    </td>
                  </tr>
                )}
                {isAdmin && (
                  <tr>
                    <th>{_('vmCreator')}</th>
                    <td>
                      <SelectUser onChange={this._updateUser} value={vm.creation?.user} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Col>
        </Row>
      </Container>
    )
  }
}
