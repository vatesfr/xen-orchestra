import _ from 'messages'
import TabButton from 'tab-button'
import CopyToClipboard from 'react-copy-to-clipboard'
import isEmpty from 'lodash/isEmpty'
import React from 'react'
import { Row, Col } from 'grid'
import { normalizeXenToolsStatus, osFamily } from 'utils'
import {
  cloneVm,
  convertVm,
  deleteVm,
  recoveryStartVm,
  restartVm,
  stopVm,
  suspendVm
} from 'xo'

export default ({
  vm
}) => <div>
  <Row>
    <Col smallSize={12} className='text-xs-right'>
      {vm.power_state === 'Running'
        ? <span>
          <TabButton
            btnStyle='primary'
            handler={() => suspendVm(vm)}
            icon='vm-suspend'
            labelId='suspendVmLabel'
          />
          <TabButton
            btnStyle='warning'
            handler={() => restartVm(vm, true)}
            icon='vm-force-reboot'
            labelId='forceRebootVmLabel'
          />
          <TabButton
            btnStyle='warning'
            handler={() => stopVm(vm, true)}
            icon='vm-force-shutdown'
            labelId='forceShutdownVmLabel'
          />
        </span>
        : null
      }
      {vm.power_state === 'Halted'
        ? <span>
          <TabButton
            btnStyle='primary'
            handler={() => recoveryStartVm(vm)}
            icon='vm-recovery-mode'
            labelId='recoveryModeLabel'
          />
          <TabButton
            btnStyle='primary'
            handler={() => cloneVm(vm, true)}
            icon='vm-clone'
            labelId='cloneVmLabel'
          />
          <TabButton
            btnStyle='danger'
            handler={() => convertVm(vm)}
            icon='vm-create-template'
            labelId='vmConvertButton'
          />
        </span>
        : null
      }
      <TabButton
        btnStyle='danger'
        handler={() => deleteVm(vm)}
        icon='vm-delete'
        labelId='vmRemoveButton'
      />
    </Col>
    <Col smallSize={12}>
      <h3>{_('xenSettingsLabel')}</h3>
      <table className='table'>
        <tbody>
          <tr>
            <th>{_('uuid')}</th>
            <td className='copy-to-clipboard'>
              {vm.uuid}&nbsp;
              <CopyToClipboard text={vm.uuid}>
                <button className='btn btn-sm btn-secondary btn-copy-to-clipboard'>
                  <i className='xo-icon-clipboard'></i>
                </button>
              </CopyToClipboard>
            </td>
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
          {vm.PV_args
            ? <tr>
              <th key={0}>{_('pvArgsLabel')}</th>
              <td key={1}>{vm.PV_args}</td>
            </tr>
            : null
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
            <td>{vm.auto_poweron ? _('enabledAutoPowerOn') : _('disabledAutoPowerOn')}</td>
          </tr>
          <tr>
            <th>{_('ha')}</th>
            <td>{vm.high_availability ? _('enabledHa') : _('disabledHa')}</td>
          </tr>
        </tbody>
      </table>
      <br />
      <h3>{_('vmLimitsLabel')}</h3>
      <table className='table table-hover'>
        <tbody>
          <tr>
            <th>{_('vmCpuLimitsLabel')}</th>
            <td></td>
          </tr>
          <tr>
            <th>{_('vmMemoryLimitsLabel')}</th>
            <td></td>
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
                : [
                  <i className={'icon-' + osFamily(vm.os_version.distro)} />,
                  ' ' + vm.os_version.name
                ]
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
</div>
