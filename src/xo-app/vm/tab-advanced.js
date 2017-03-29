import _ from 'intl'
import Component from 'base-component'
import Copiable from 'copiable'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import React from 'react'
import renderXoItem from 'render-xo-item'
import TabButton from 'tab-button'
import { Toggle } from 'form'
import { Number, Size, Text, XoSelect } from 'editable'
import { Container, Row, Col } from 'grid'
import {
  every,
  map,
  uniq
} from 'lodash'
import {
  connectStore,
  firstDefined,
  formatSize,
  normalizeXenToolsStatus,
  osFamily
} from 'utils'
import {
  cloneVm,
  convertVmToTemplate,
  deleteVm,
  editVm,
  recoveryStartVm,
  restartVm,
  resumeVm,
  stopVm,
  suspendVm,
  XEN_DEFAULT_CPU_CAP,
  XEN_DEFAULT_CPU_WEIGHT
} from 'xo'
import {
  createGetObjectsOfType,
  createSelector
} from 'selectors'

const forceReboot = vm => restartVm(vm, true)
const forceShutdown = vm => stopVm(vm, true)
const fullCopy = vm => cloneVm(vm, true)

@connectStore(() => {
  const getAffinityHost = createGetObjectsOfType('host').find(
    (_, { vm }) => ({ id: vm.affinityHost })
  )

  const getVbds = createGetObjectsOfType('VBD').pick(
    (_, { vm }) => vm.$VBDs
  )
  const getVdis = createGetObjectsOfType('VDI').pick(
    createSelector(
      getVbds,
      vbds => map(vbds, 'VDI')
    )
  )
  const getSrs = createGetObjectsOfType('SR').pick(
    createSelector(
      getVdis,
      vdis => uniq(map(vdis, '$SR'))
    )
  )
  const getSrsContainers = createSelector(
    getSrs,
    srs => uniq(map(srs, '$container'))
  )

  const getAffinityHostPredicate = createSelector(
    getAffinityHost,
    getSrsContainers,
    (affinityHost, containers) =>
      host => (!affinityHost || host.id !== affinityHost.id) &&
        every(containers, container => container === host.$pool || container === host.id)
  )

  return {
    affinityHost: getAffinityHost,
    affinityHostPredicate: getAffinityHostPredicate
  }
})
class AffinityHost extends Component {
  _editAffinityHost = host =>
    editVm(this.props.vm, { affinityHost: host.id || null })

  render () {
    const {
      affinityHost,
      affinityHostPredicate
    } = this.props

    return <span>
      <XoSelect
        onChange={this._editAffinityHost}
        predicate={affinityHostPredicate}
        value={affinityHost}
        xoType='host'
      >
        {affinityHost
          ? renderXoItem(affinityHost)
          : _('noAffinityHost')
        }
      </XoSelect>
      {' '}
      {affinityHost && <a role='button' onClick={this._editAffinityHost}>
        <Icon icon='remove' />
      </a>}
    </span>
  }
}

export default ({
  vm
}) => <Container>
  <Row>
    <Col className='text-xs-right'>
      {vm.power_state === 'Running' &&
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
      }
      {vm.power_state === 'Halted' &&
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
            handler={fullCopy}
            handlerParam={vm}
            icon='vm-clone'
            labelId='cloneVmLabel'
          />
          <TabButton
            btnStyle='danger'
            handler={convertVmToTemplate}
            handlerParam={vm}
            icon='vm-create-template'
            labelId='vmConvertButton'
            redirectOnSuccess='/'
          />
        </span>
      }
      {vm.power_state === 'Suspended' &&
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
      }
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
            <th>{_('uuid')}</th>
            <Copiable tagName='td'>
              {vm.uuid}
            </Copiable>
          </tr>
          <tr>
            <th>{_('virtualizationMode')}</th>
            <td>
              {vm.virtualizationMode === 'pv'
                ? _('paraVirtualizedMode')
                : _('hardwareVirtualizedMode')
              }
            </td>
          </tr>
          {vm.virtualizationMode === 'pv' &&
            <tr>
              <th>{_('pvArgsLabel')}</th>
              <td>
                <Text value={vm.PV_args} onChange={value => editVm(vm, { PV_args: value })} />
              </td>
            </tr>
          }
          <tr>
            <th>{_('cpuWeightLabel')}</th>
            <td>
              <Number value={vm.cpuWeight == null ? null : vm.cpuWeight} onChange={value => editVm(vm, { cpuWeight: value })} nullable>
                {vm.cpuWeight == null ? _('defaultCpuWeight', { value: XEN_DEFAULT_CPU_WEIGHT }) : vm.cpuWeight}
              </Number>
            </td>
          </tr>
          <tr>
            <th>{_('cpuCapLabel')}</th>
            <td>
              <Number value={vm.cpuCap == null ? null : vm.cpuCap} onChange={value => editVm(vm, { cpuCap: value })} nullable>
                {vm.cpuCap == null ? _('defaultCpuCap', { value: XEN_DEFAULT_CPU_CAP }) : vm.cpuCap}
              </Number>
            </td>
          </tr>
          <tr>
            <th>{_('autoPowerOn')}</th>
            <td><Toggle value={vm.auto_poweron} onChange={value => editVm(vm, { auto_poweron: value })} /></td>
          </tr>
          <tr>
            <th>{_('ha')}</th>
            <td><Toggle value={vm.high_availability} onChange={value => editVm(vm, { high_availability: value })} /></td>
          </tr>
          <tr>
            <th>{_('vmAffinityHost')}</th>
            <td>
              <AffinityHost vm={vm} />
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
              <Number value={vm.CPUs.number} onChange={cpus => editVm(vm, { cpus })} />
              /
              {vm.power_state === 'Running'
                ? vm.CPUs.max
                : <Number value={vm.CPUs.max} onChange={cpusStaticMax => editVm(vm, { cpusStaticMax })} />
              }
            </td>
          </tr>
          <tr>
            <th>{_('vmMemoryLimitsLabel')}</th>
            <td>
              <p>Static: {formatSize(vm.memory.static[0])}/<Size value={firstDefined(vm.memory.static[1], null)} onChange={memoryStaticMax => editVm(vm, { memoryStaticMax })} /></p>
              <p>Dynamic: <Size value={firstDefined(vm.memory.dynamic[0], null)} onChange={memoryMin => editVm(vm, { memoryMin })} />/<Size value={firstDefined(vm.memory.dynamic[1], null)} onChange={memoryMax => editVm(vm, { memoryMax })} /></p>
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
            <td>{_('xenToolsStatusValue', { status: normalizeXenToolsStatus(vm.xenTools) })}</td>
          </tr>
          <tr>
            <th>{_('osName')}</th>
            <td>
              {isEmpty(vm.os_version)
                ? _('unknownOsName')
                : <span><Icon className='text-info' icon={osFamily(vm.os_version.distro)} />&nbsp;{vm.os_version.name}</span>
              }
            </td>
          </tr>
          <tr>
            <th>{_('osKernel')}</th>
            <td>{vm.os_version ? vm.os_version.uname ? vm.os_version.uname : _('unknownOsKernel') : _('unknownOsKernel')}</td>
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
        </tbody>
      </table>
    </Col>
  </Row>
</Container>
