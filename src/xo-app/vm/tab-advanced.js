import _ from 'messages'
import CopyToClipboard from 'react-copy-to-clipboard'
import React from 'react'
import { Row, Col } from 'grid'
import { normalizeXenToolsStatus, osFamily } from 'utils'

export default ({
  vm
}) => <div>
  <Row>
    <Col smallSize={12}>
      <h3>{_('xenSettingsLabel')}</h3>
      <table className='table table-hover'>
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
        <tr>
        {vm.PV_args
          ? [
            <th key={0}>{_('pvArgsLabel')}</th>,
            <td key={1}>{vm.PV_args}</td>
          ]
          : null
        }
        </tr>
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
      </table>
      <hr/>
      <h3>{_('vmLimitsLabel')}</h3>
      <Row>
        <Col smallSize={6}>
          <dl className='dl-horizontal'>
            <dt>{_('vmCpuLimitsLabel')}</dt>
            <dd>TODO</dd>
          </dl>
        </Col>
        <Col smallSize={6}>
          <dl className='dl-horizontal'>
            <dt>{_('vmMemoryLimitsLabel')}</dt>
            <dd>TODO</dd>
          </dl>
        </Col>
      </Row>
      <hr/>
      <h3>{_('guestOsLabel')}</h3>
      <Row>
        <Col smallSize={4}>
          <dl className='dl-horizontal'>
            <dt>{_('xenToolsStatus')}</dt>
            <dd>{_('xenToolsStatusValue', { status: normalizeXenToolsStatus(vm.xenTools) })}</dd>
          </dl>
        </Col>
        <Col smallSize={4}>
          <dl className='dl-horizontal'>
            <dt>{_('osName')}</dt>
            <dd><i className={'icon-' + osFamily(vm.os_version.distro)} />{vm.os_version ? vm.os_version.name : _('unknownOsName')}</dd>
          </dl>
        </Col>
        <Col smallSize={4}>
          <dl className='dl-horizontal'>
            <dt>{_('osKernel')}</dt>
            <dd>{vm.os_version ? vm.os_version.uname ? vm.os_version.uname : _('unknownOsKernel') : _('unknownOsKernel')}</dd>
          </dl>
        </Col>
      </Row>
      <hr/>
      <h3>{_('miscLabel')}</h3>
      <Row>
        <Col smallSize={12}>
          <dl className='dl-horizontal'>
            <dt>{_('originalTemplate')}</dt>
            <dd>{vm.other.base_template_name ? vm.other.base_template_name : _('unknownOriginalTemplate')}</dd>
          </dl>
        </Col>
      </Row>
    </Col>
  </Row>
</div>
