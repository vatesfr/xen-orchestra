import _ from 'intl'
import React from 'react'
import { Col, Row } from 'grid'
import { formatSize } from 'utils'

const VmData = ({ data }) => (
  <div>
    <Row>
      <Col mediumSize={6}>
        <div className='form-group'>
          <label>{_('vmNameLabel')}:</label> <span>{data.nameLabel}</span>
        </div>
        <div className='form-group'>
          <label>{_('powerState')}:</label>{' '}
          <span>{data.powerState === 'poweredOn' ? _('powerStateRunning') : _('powerStateHalted')}</span>
        </div>
      </Col>
      <Col mediumSize={6}>
        <div className='form-group'>
          <label>{_('nCpus')}:</label> <span>{data.nCpus}</span>
        </div>
        <div className='form-group'>
          <label>{_('vmMemory')}:</label> <span>{formatSize(data.memory)}</span>
        </div>
      </Col>
    </Row>
    <Row>
      <Col mediumSize={6}>
        <div className='form-group'>
          <label>{_('firmware')}:</label> <span>{data.firmware}</span>
        </div>
      </Col>
      <Col mediumSize={6}>
        <div className='form-group'>
          <label>{_('guestToolStatus')}:</label>{' '}
          <span>{data.guestToolsInstalled ? _('noToolsInstalled') : _('toolsInstalled')}</span>
        </div>
      </Col>
    </Row>
    <Row>
      <Col mediumSize={12}>
        <div className='form-group'>
          <label>{_('homeSrPage')}:</label>{' '}
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
