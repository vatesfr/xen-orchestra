import _ from 'messages'
import Copiable from 'copiable'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import React from 'react'
import TabButton from 'tab-button'
import { Toggle } from 'form'
import { Number, Size, Text } from 'editable'
import { Container, Row, Col } from 'grid'
import { formatSize, normalizeXenToolsStatus, osFamily } from 'utils'
import {
  cloneVm,
  convertVmToTemplate,
  deleteVm,
  editVm,
  recoveryStartVm,
  restartVm,
  resumeVm,
  stopVm,
  suspendVm
} from 'xo'

const forceReboot = vm => restartVm(vm, true)
const forceShutdown = vm => stopVm(vm, true)
const fullCopy = vm => cloneVm(vm, true)

export default ({
  vm
}) => <Container>
  <Row>
    <Col mediumSize={12} className='text-xs-right'>
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
            icon='vm-clone'
            labelId='cloneVmLabel'
          />
          <TabButton
            btnStyle='danger'
            handler={convertVmToTemplate}
            handlerParam={vm}
            icon='vm-create-template'
            labelId='vmConvertButton'
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
    <Col mediumSize={12}>
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
          {vm.PV_args &&
            <tr>
              <th>{_('pvArgsLabel')}</th>
              <td>
                <Text value={vm.PV_args} onChange={value => editVm(vm, { PV_args: value })} />
              </td>
            </tr>
          }
          <tr>
            <th>{_('cpuWeightLabel')}</th>
            {vm.cpuWeight
              ? <td>{vm.cpuWeight}</td>
              : <td>{_('defaultCpuWeight')}</td>
            }
          </tr>
          <tr>
            <th>{_('autoPowerOn')}</th>
            <td><Toggle defaultValue={vm.auto_poweron} onChange={value => editVm(vm, { auto_poweron: value })} /></td>
          </tr>
          <tr>
            <th>{_('ha')}</th>
            <td><Toggle defaultValue={vm.high_availability} onChange={value => editVm(vm, { high_availability: value })} /></td>
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
              {vm.power_state === 'Running'
                ? vm.CPUs.max
                : <Number value={vm.CPUs.max} onChange={value => editVm(vm, { cpusMax: value })} />
              }
            </td>
          </tr>
          <tr>
            <th>{_('vmMemoryLimitsLabel')}</th>
            <td>
              <p>Static: {formatSize(vm.memory.static[0])}/<Size value={vm.memory.static[1]} onChange={memoryStaticMax => editVm(vm, { memoryStaticMax })} /></p>
              <p>Dynamic: <Size value={vm.memory.dynamic[0]} onChange={memoryMin => editVm(vm, { memoryMin })} />/<Size value={vm.memory.dynamic[1]} onChange={memoryMax => editVm(vm, { memoryMax })} /></p>
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
            <td>{isEmpty(vm.os_version)
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
