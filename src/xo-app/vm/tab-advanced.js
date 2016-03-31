import _ from 'messages'
import CopyToClipboard from 'react-copy-to-clipboard'
import React from 'react'
import { Row, Col } from 'grid'
import { normalizeXenToolsStatus } from 'utils'

export default ({
  vm
}) => <div>
  <Row>
    <Col smallSize={12}>
      <h3>{_('xenSettingsLabel')}</h3>
      <Row>
        <Col smallSize={6}>
          <dl className='dl-horizontal'>
            <dt>{_('uuid')}</dt>
            <dd className='copy-to-clipboard'>
              {vm.uuid}&nbsp;
              <CopyToClipboard text={vm.uuid}>
                <button className='btn btn-sm btn-secondary btn-copy-to-clipboard'>
                  <i className='xo-icon-clipboard'></i>
                </button>
              </CopyToClipboard>
            </dd>
          </dl>
        </Col>
        <Col smallSize={6}>
          <dl className='dl-horizontal'>
            <dt>{_('virtualizationMode')}</dt>
            <dd>
              {vm.virtualizationMode === 'pv'
                ? _('paraVirtualizedMode')
                : _('hardwareVirtualizedMode')
              }
            </dd>
          </dl>
        </Col>
      </Row>
      <Row>
        <Col smallSize={12}>
          <dl className='dl-horizontal'>
            {vm.PV_args
              ? [
                <dt key={0}>{_('pvArgsLabel')}</dt>,
                <dd key={1}>{vm.PV_args}</dd>
              ]
              : null
            }
          </dl>
        </Col>
      </Row>
      <Row>
        <Col smallSize={4}>
          <dl className='dl-horizontal'>
            <dt>{_('cpuWeightLabel')}</dt>
            {vm.cpuWeight
              ? <dd>{vm.cpuWeight}</dd>
              : <dd>{_('defaultCpuWeight')}</dd>
            }
          </dl>
        </Col>
        <Col smallSize={4}>
          <dl className='dl-horizontal'>
            <dt>{_('autoPowerOn')}</dt>
            <dd>{vm.auto_poweron ? _('enabledAutoPowerOn') : _('disabledAutoPowerOn')}</dd>
          </dl>
        </Col>
        <Col smallSize={4}>
          <dl className='dl-horizontal'>
            <dt>{_('ha')}</dt>
            <dd>{vm.high_availability ? _('enabledHa') : _('disabledHa')}</dd>
          </dl>
        </Col>
      </Row>
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
            <dd>{vm.os_version ? vm.os_version.name : _('unknownOsName')}</dd>
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
