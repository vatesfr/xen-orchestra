import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import decorate from 'apply-decorators'
import defined, { get } from '@xen-orchestra/defined'
import getEventValue from 'get-event-value'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import renderXoItem from 'render-xo-item'
import SelectBootFirmware from 'select-boot-firmware'
import SelectCoresPerSocket from 'select-cores-per-socket'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { error } from 'notification'
import { confirm } from 'modal'
import { Container, Row, Col } from 'grid'
import { CustomFields } from 'custom-fields'
import { injectState, provideState } from 'reaclette'
import { Number, Select as EditableSelect, Size, Text, XoSelect } from 'editable'
import { Select, Toggle } from 'form'
import { SelectResourceSet, SelectRole, SelectSubject, SelectVgpuType } from 'select-objects'
import { addSubscriptions, connectStore, formatSize, getVirtualizationModeLabel, osFamily } from 'utils'
import { every, filter, find, isEmpty, keyBy, map, times, some, uniq } from 'lodash'
import {
  addAcl,
  changeVirtualizationMode,
  cloneVm,
  convertVmToTemplate,
  createVgpu,
  deleteVgpu,
  deleteVm,
  editVm,
  getVmsHaValues,
  isVmRunning,
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
  vmWarmMigration,
  XEN_DEFAULT_CPU_CAP,
  XEN_DEFAULT_CPU_WEIGHT,
  XEN_VIDEORAM_VALUES,
} from 'xo'
import { createGetObject, createGetObjectsOfType, createSelector, isAdmin } from 'selectors'
import { getXoaPlan, PREMIUM } from 'xoa-plans'
import { SelectSuspendSr } from 'select-suspend-sr'

import BootOrder from './boot-order'

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
          <ActionButton btnStyle='primary' handler={effects.addAcls} icon='add' size='small' tooltip={_('vmAddAcls')} />
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

@connectStore(() => {
  const getVgpus = createGetObjectsOfType('vgpu').pick((_, { vm }) => vm.$VGPUs)
  const getGpuGroup = createGetObjectsOfType('gpuGroup').pick(createSelector(getVgpus, vgpus => map(vgpus, 'gpuGroup')))

  return {
    gpuGroup: getGpuGroup,
    isAdmin,
    vgpus: getVgpus,
    vmPool: createGetObject((_, props) => get(() => props.vm.$pool)),
  }
})
export default class TabAdvanced extends Component {
  componentDidMount() {
    getVmsHaValues().then(vmsHaValues => this.setState({ vmsHaValues }))
  }

  _getCpuMaskOptions = createSelector(
    () => this.props.vm,
    vm =>
      times(vm.CPUs.max, number => ({
        value: number,
        label: `Core ${number}`,
      }))
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

  render() {
    const { container, isAdmin, vgpus, vm, vmPool } = this.props
    const isWarmMigrationAvailable = getXoaPlan().value >= PREMIUM.value
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
                  <th>{_('autoPowerOn')}</th>
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
                  <th>{_('windowsUpdateTools')}</th>
                  <td>
                    <Toggle value={vm.hasVendorDevice} onChange={value => editVm(vm, { hasVendorDevice: value })} />
                  </td>
                </tr>
                {vm.virtualizationMode === 'hvm' && (
                  <tr>
                    <th>{_('nestedVirt')}</th>
                    <td>
                      <Toggle
                        disabled={vm.power_state !== 'Halted'}
                        value={vm.expNestedHvm}
                        onChange={value => editVm(vm, { expNestedHvm: value })}
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
                    </td>
                  </tr>
                )}
                {vm.boot.firmware === 'uefi' && (
                  <tr>
                    <th>{_('secureBoot')}</th>
                    <td>
                      <Toggle value={vm.secureBoot} onChange={value => editVm(vm, { secureBoot: value })} />
                      <a
                        className='text-muted'
                        href='https://xcp-ng.org/docs/guides.html#guest-uefi-secure-boot'
                        rel='noopener noreferrer'
                        style={{ display: 'block' }}
                        target='_blank'
                      >
                        <Icon icon='info' /> {_('secureBootLinkToDocumentationMessage')}
                      </a>
                    </td>
                  </tr>
                )}
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
            <h3>{_('miscLabel')}</h3>
            <table className='table table-hover'>
              <tbody>
                <tr>
                  <th>{_('originalTemplate')}</th>
                  <td>{vm.other.base_template_name ? vm.other.base_template_name : _('unknownOriginalTemplate')}</td>
                </tr>
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
              </tbody>
            </table>
          </Col>
        </Row>
      </Container>
    )
  }
}
