import _ from 'intl'
import React from 'react'
import { Col, Row } from 'grid'
import { formatSize } from 'utils'

const VmData = ({ data }) => (
  <div>
    <Row>
      <Col mediumSize={6}>
        <div>{_('keyValue', { key: _('vmNameLabel'), value: data.nameLabel })}</div>
        <div>
          {_('keyValue', {
            key: _('powerState'),
            value: data.powerState === 'poweredOn' ? _('powerStateRunning') : _('powerStateHalted'),
          })}
        </div>
      </Col>
      <Col mediumSize={6}>
        <div>{_('keyValue', { key: _('nCpus'), value: data.nCpus })}</div>
        <div>{_('keyValue', { key: _('vmMemory'), value: formatSize(data.memory) })}</div>
      </Col>
    </Row>
    <Row>
      <Col mediumSize={6}>
        <div>{_('keyValue', { key: _('firmware'), value: data.firmware })}</div>
      </Col>
      <Col mediumSize={6}>
        <div>
          {_('keyValue', {
            key: _('guestToolStatus'),
            value: data.guestToolsInstalled ? _('noToolsInstalled') : _('toolsInstalled'),
          })}
        </div>
      </Col>
    </Row>
    <Row>
      <Col mediumSize={12}>
        <div>
          <span>
            {_('vmSrUsage', {
              free: formatSize(data.storage.free),
              total: formatSize(data.storage.used + data.storage.free),
              used: formatSize(data.storage.used),
            })}
          </span>
        </div>
      </Col>
    </Row>
  </div>
)

export default VmData
