import _ from 'intl'
import Icon from 'icon'
import React from 'react'
import { Col, Row } from 'grid'
import { formatSize } from 'utils'

const ReferenceVmStatus = ({ status, srLabel }) => {
  if (status === 'none') {
    return <span>{_('esxiImportNoReferenceVm')}</span>
  }
  if (status === 'sameSr') {
    return (
      <span className='text-success'>
        <Icon icon='success' /> {_('esxiImportReferenceVmSameSr')}
      </span>
    )
  }
  if (status === 'otherSr') {
    return (
      <strong className='text-danger'>
        <Icon icon='alarm' /> {_('esxiImportReferenceVmOtherSr', { sr: srLabel })}
      </strong>
    )
  }
  return null
}

const VmData = ({ data, referenceVmStatus }) => (
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
    {referenceVmStatus && (
      <Row>
        <Col mediumSize={12}>
          <ReferenceVmStatus {...referenceVmStatus} />
        </Col>
      </Row>
    )}
  </div>
)

export default VmData
