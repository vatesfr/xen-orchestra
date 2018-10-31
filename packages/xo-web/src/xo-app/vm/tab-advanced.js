import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import defined from '@xen-orchestra/defined'
import getEventValue from 'get-event-value'
import Icon from 'icon'
import React from 'react'
import renderXoItem from 'render-xo-item'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { assign, every, find, includes, isEmpty, map, uniq } from 'lodash'
import { confirm } from 'modal'
import { Container, Row, Col } from 'grid'
import { Number, Size, Text, XoSelect } from 'editable'
import { Select, Toggle } from 'form'
import { SelectResourceSet, SelectVgpuType } from 'select-objects'
import {
  addSubscriptions,
  connectStore,
  formatSize,
  getCoresPerSocketPossibilities,
  osFamily,
  VIRTUALIZATION_MODE_LABEL,
} from 'utils'
import {
  cloneVm,
  convertVmToTemplate,
  createVgpu,
  deleteVgpu,
  deleteVm,
  editVm,
  getVmsHaValues,
  isVmRunning,
  recoveryStartVm,
  restartVm,
  resumeVm,
  shareVm,
  startVm,
  stopVm,
  subscribeResourceSets,
  suspendVm,
  XEN_DEFAULT_CPU_CAP,
  XEN_DEFAULT_CPU_WEIGHT,
  XEN_VIDEORAM_VALUES,
} from 'xo'
import { createGetObjectsOfType, createSelector, isAdmin } from 'selectors'

// Button's height = react-select's height(36 px) + react-select's border-width(1 px) * 2
// https://github.com/JedWatson/react-select/blob/916ab0e62fc7394be8e24f22251c399a68de8b1c/less/select.less#L21, L22
const SHARE_BUTTON_STYLE = { height: '38px' }

const forceReboot = vm => restartVm(vm, true)
const forceShutdown = vm => stopVm(vm, true)
const fullCopy = vm => cloneVm(vm, true)
const shareVmProxy = vm => shareVm(vm, vm.resourceSet)

@connectStore(() => {
  const getAffinityHost = createGetObjectsOfType('host').find((_, { vm }) => ({
    id: vm.affinityHost,
  }))

  const getVbds = createGetObjectsOfType('VBD').pick((_, { vm }) => vm.$VBDs)
  const getVdis = createGetObjectsOfType('VDI').pick(
    createSelector(getVbds, vbds => map(vbds, 'VDI'))
  )
  const getSrs = createGetObjectsOfType('SR').pick(
    createSelector(getVdis, vdis => uniq(map(vdis, '$SR')))
  )
  const getSrsContainers = createSelector(getSrs, srs =>
    uniq(map(srs, '$container'))
  )

  const getAffinityHostPredicate = createSelector(
    getSrsContainers,
    containers => host =>
      every(
        containers,
        container => container === host.$pool || container === host.id
      )
  )

  return {
    affinityHost: getAffinityHost,
    affinityHostPredicate: getAffinityHostPredicate,
  }
})
class AffinityHost extends Component {
  _editAffinityHost = host =>
    editVm(this.props.vm, { affinityHost: host.id || null })

  render () {
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
class ResourceSetItem extends Component {
  _getResourceSet = createSelector(
    () => this.props.resourceSets,
    () => this.props.id,
    (resourceSets, id) =>
      assign(find(resourceSets, { id }), { type: 'resourceSet' })
  )

  render () {
    return this.props.resourceSets === undefined
      ? null
      : renderXoItem(this._getResourceSet())
  }
}

class NewVgpu extends Component {
  get value () {
    return this.state
  }

  _getPredicate = createSelector(
    () => this.props.vm && this.props.vm.$pool,
    poolId => vgpuType => poolId === vgpuType.$pool
  )

  render () {
    return (
      <Container>
        <Row>
          <Col size={6}>{_('vmSelectVgpuType')}</Col>
          <Col size={6}>
            <SelectVgpuType
              onChange={this.linkState('vgpuType')}
              predicate={this._getPredicate()}
            />
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
    }).then(({ vgpuType }) =>
      createVgpu(this.props.vm, { vgpuType, gpuGroup: vgpuType.gpuGroup })
    )

  render () {
    const { vgpus, vm } = this.props

    return (
      <div>
        {map(vgpus, vgpu => (
          <span key={vgpu.id} className='mb-1'>
            {!isVmRunning(vm) && (
              <ActionButton
                handler={deleteVgpu}
                handlerParam={vgpu}
                icon='delete'
                size='small'
              />
            )}{' '}
            {renderXoItem(vgpu)}
          </span>
        ))}
        {isEmpty(vgpus) && (
          <span>
            {!isVmRunning(vm) && (
              <ActionButton
                handler={this._createVgpu}
                icon='add'
                size='small'
              />
            )}{' '}
            {_('vmVgpuNone')}
          </span>
        )}
      </div>
    )
  }
}

class CoresPerSocket extends Component {
  _getCoresPerSocketPossibilities = createSelector(
    () => {
      const { container } = this.props
      if (container != null) {
        return container.cpus.cores
      }
    },
    () => this.props.vm.CPUs.number,
    getCoresPerSocketPossibilities
  )

  _selectedValueIsNotInOptions = createSelector(
    () => this.props.vm.coresPerSocket,
    this._getCoresPerSocketPossibilities,
    (selectedCoresPerSocket, options) =>
      selectedCoresPerSocket !== undefined &&
      !includes(options, selectedCoresPerSocket)
  )

  _onChange = event =>
    editVm(this.props.vm, { coresPerSocket: getEventValue(event) || null })

  render () {
    const { container, vm } = this.props
    const selectedCoresPerSocket = vm.coresPerSocket
    const options = this._getCoresPerSocketPossibilities()

    return (
      <form className='form-inline'>
        {container != null ? (
          <span>
            <select
              className='form-control'
              onChange={this._onChange}
              value={selectedCoresPerSocket || ''}
            >
              {_({ key: 'none' }, 'vmChooseCoresPerSocket', message => (
                <option value=''>{message}</option>
              ))}
              {this._selectedValueIsNotInOptions() &&
                _(
                  { key: 'incorrect' },
                  'vmCoresPerSocketIncorrectValue',
                  message => (
                    <option value={selectedCoresPerSocket}> {message}</option>
                  )
                )}
              {map(options, coresPerSocket =>
                _(
                  { key: coresPerSocket },
                  'vmCoresPerSocket',
                  {
                    nSockets: vm.CPUs.number / coresPerSocket,
                    nCores: coresPerSocket,
                  },
                  message => <option value={coresPerSocket}>{message}</option>
                )
              )}
            </select>{' '}
            {this._selectedValueIsNotInOptions() && (
              <Tooltip content={_('vmCoresPerSocketIncorrectValueSolution')}>
                <Icon icon='error' size='lg' />
              </Tooltip>
            )}
          </span>
        ) : selectedCoresPerSocket != null ? (
          _('vmCoresPerSocket', {
            nSockets: vm.CPUs.number / selectedCoresPerSocket,
            nCores: selectedCoresPerSocket,
          })
        ) : (
          _('vmCoresPerSocketNone')
        )}
      </form>
    )
  }
}

const NIC_TYPE_OPTIONS = [
  {
    label: 'Realtek RTL819',
    value: '',
  },
  {
    label: 'Intel e1000',
    value: 'e1000',
  },
]

@connectStore(() => {
  const getVgpus = createGetObjectsOfType('vgpu').pick((_, { vm }) => vm.$VGPUs)
  const getGpuGroup = createGetObjectsOfType('gpuGroup').pick(
    createSelector(getVgpus, vgpus => map(vgpus, 'gpuGroup'))
  )

  return {
    gpuGroup: getGpuGroup,
    isAdmin,
    vgpus: getVgpus,
  }
})
export default class TabAdvanced extends Component {
  componentDidMount () {
    getVmsHaValues().then(vmsHaValues => this.setState({ vmsHaValues }))
  }

  _onNicTypeChange = value =>
    editVm(this.props.vm, { nicType: value === '' ? null : value })

  render () {
    const { container, isAdmin, vgpus, vm } = this.props
    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            {vm.power_state === 'Running' && (
              <span>
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
                  handler={resumeVm}
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
        <Row>
          <Col>
            <h3>{_('xenSettingsLabel')}</h3>
            <table className='table'>
              <tbody>
                <tr>
                  <th>{_('virtualizationMode')}</th>
                  <td>{_(VIRTUALIZATION_MODE_LABEL[vm.virtualizationMode])}</td>
                </tr>
                {vm.virtualizationMode === 'pv' && (
                  <tr>
                    <th>{_('pvArgsLabel')}</th>
                    <td>
                      <Text
                        value={vm.PV_args}
                        onChange={value => editVm(vm, { PV_args: value })}
                      />
                    </td>
                  </tr>
                )}
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
                      {vm.cpuCap == null
                        ? _('defaultCpuCap', { value: XEN_DEFAULT_CPU_CAP })
                        : vm.cpuCap}
                    </Number>
                  </td>
                </tr>
                <tr>
                  <th>{_('autoPowerOn')}</th>
                  <td>
                    <Toggle
                      value={Boolean(vm.auto_poweron)}
                      onChange={value => editVm(vm, { auto_poweron: value })}
                    />
                  </td>
                </tr>
                <tr>
                  <th>{_('windowsUpdateTools')}</th>
                  <td>
                    <Toggle
                      value={vm.hasVendorDevice}
                      onChange={value => editVm(vm, { hasVendorDevice: value })}
                    />
                  </td>
                </tr>
                <tr>
                  <th>{_('nestedVM')}</th>
                  <td>
                    <Toggle
                      disabled={vm.power_state !== 'Halted'}
                      value={Boolean(vm.expNestedHvm)}
                      onChange={value => editVm(vm, { expNestedHvm: value })}
                    />
                  </td>
                </tr>
                <tr>
                  <th>{_('ha')}</th>
                  <td>
                    <select
                      className='form-control'
                      onChange={event =>
                        editVm(vm, { high_availability: getEventValue(event) })
                      }
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
                        onChange={value =>
                          editVm(vm, { vga: value ? 'std' : 'cirrus' })
                        }
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
                        onChange={event =>
                          editVm(vm, { videoram: +getEventValue(event) })
                        }
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
              </tbody>
            </table>
            <br />
            <h3>{_('vmLimitsLabel')}</h3>
            <table className='table table-hover'>
              <tbody>
                <tr>
                  <th>{_('vmCpuLimitsLabel')}</th>
                  <td>
                    <Number
                      value={vm.CPUs.number}
                      onChange={cpus => editVm(vm, { cpus })}
                    />
                    /
                    {vm.power_state === 'Running' ? (
                      vm.CPUs.max
                    ) : (
                      <Number
                        value={vm.CPUs.max}
                        onChange={cpusStaticMax =>
                          editVm(vm, { cpusStaticMax })
                        }
                      />
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
                        onChange={memoryStaticMax =>
                          editVm(vm, { memoryStaticMax })
                        }
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
                  <th>{_('xenToolsStatus')}</th>
                  <td>
                    {vm.xenTools
                      ? `${vm.xenTools.major}.${vm.xenTools.minor}`
                      : _('xenToolsNotInstalled')}
                  </td>
                </tr>
                <tr>
                  <th>{_('osName')}</th>
                  <td>
                    {isEmpty(vm.os_version) ? (
                      _('unknownOsName')
                    ) : (
                      <span>
                        <Icon
                          className='text-info'
                          icon={osFamily(vm.os_version.distro)}
                        />
                        &nbsp;
                        {vm.os_version.name}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{_('osKernel')}</th>
                  <td>
                    {(vm.os_version && vm.os_version.uname) ||
                      _('unknownOsKernel')}
                  </td>
                </tr>
              </tbody>
            </table>
            <br />
            <h3>{_('miscLabel')}</h3>
            <table className='table table-hover'>
              <tbody>
                <tr>
                  <th>{_('originalTemplate')}</th>
                  <td>
                    {vm.other.base_template_name
                      ? vm.other.base_template_name
                      : _('unknownOriginalTemplate')}
                  </td>
                </tr>
                <tr>
                  <th>{_('resourceSet')}</th>
                  <td>
                    {isAdmin ? (
                      <div className='input-group'>
                        <SelectResourceSet
                          onChange={resourceSet =>
                            editVm(vm, {
                              resourceSet:
                                resourceSet != null
                                  ? resourceSet.id
                                  : resourceSet,
                            })
                          }
                          value={vm.resourceSet}
                        />
                        {vm.resourceSet !== undefined && (
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
                    ) : vm.resourceSet !== undefined ? (
                      <span>
                        <ResourceSetItem id={vm.resourceSet} />{' '}
                        <ActionButton
                          btnStyle='primary'
                          handler={shareVmProxy}
                          handlerParam={vm}
                          icon='vm-share'
                          size='small'
                          tooltip={_('vmShareButton')}
                        />
                      </span>
                    ) : (
                      _('resourceSetNone')
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </Col>
        </Row>
      </Container>
    )
  }
}
