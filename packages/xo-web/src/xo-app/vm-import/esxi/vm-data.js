import _, { messages } from 'intl'
import React from 'react'
import { Col, Row } from 'grid'
import { formatSize } from 'utils'
import { injectIntl } from 'react-intl'

const VmData = injectIntl(({ data, intl }) => (
  <div>
    <Row>
      <Col mediumSize={6}>
        <div className='form-group'>
          {_('keyValue', { key: intl.formatMessage(messages.vmNameLabel), value: data.nameLabel })}
        </div>
        <div className='form-group'>
          {_('keyValue', {
            key: intl.formatMessage(messages.powerState),
            value:
              data.powerState === 'poweredOn'
                ? intl.formatMessage(messages.powerStateRunning)
                : intl.formatMessage(messages.powerStateHalted),
          })}
        </div>
      </Col>
      <Col mediumSize={6}>
        <div className='form-group'>
          {_('keyValue', { key: intl.formatMessage(messages.nCpus), value: data.nCpus })}
        </div>
        <div className='form-group'>
          {_('keyValue', { key: intl.formatMessage(messages.vmMemory), value: formatSize(data.memory) })}
        </div>
      </Col>
    </Row>
    <Row>
      <Col mediumSize={6}>
        <div className='form-group'>
          {_('keyValue', { key: intl.formatMessage(messages.firmware), value: data.firmware })}
        </div>
      </Col>
      <Col mediumSize={6}>
        <div className='form-group'>
          {_('keyValue', {
            key: intl.formatMessage(messages.guestToolStatus),
            value: data.guestToolsInstalled
              ? intl.formatMessage(messages.noToolsInstalled)
              : intl.formatMessage(messages.toolsInstalled),
          })}
        </div>
      </Col>
    </Row>
    <Row>
      <Col mediumSize={12}>
        <div className='form-group'>
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
))

export default VmData
