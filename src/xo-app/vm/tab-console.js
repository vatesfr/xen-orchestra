import _ from 'messages'
import NoVnc from 'react-novnc'
import React from 'react'
import { resolveUrl } from 'xo'
import { Row, Col } from 'grid'
import {
  CpuSparkLines,
  MemorySparkLines,
  VifSparkLines,
  XvdSparkLines
} from 'xo-sparklines'

export default ({
  statsOverview,
  vm
}) => <div>
  <Row className='text-xs-center'>
    <Col smallSize={3}>
      <p>
        <i className='xo-icon-cpu fa-3x'>&nbsp;</i>
        {statsOverview && <CpuSparkLines data={statsOverview} />}
      </p>
    </Col>
    <Col smallSize={3}>
      <p>
        <i className='xo-icon-memory fa-3x'>&nbsp;</i>
        {statsOverview && <MemorySparkLines data={statsOverview} />}
      </p>
    </Col>
    <Col smallSize={3}>
      <p>
        <i className='xo-icon-disk fa-3x'>&nbsp;</i>
        {statsOverview && <XvdSparkLines data={statsOverview} />}
      </p>
    </Col>
    <Col smallSize={3}>
      <p>
        <i className='xo-icon-network fa-3x'>&nbsp;</i>
       {statsOverview && <VifSparkLines data={statsOverview} />}
      </p>
    </Col>
  </Row>
  <Row>
    <Col smallSize={5}>
      { /* TODO: insert real ISO selector, CtrlAltSuppr button and Clipboard */ }
      <div className='input-group'>
        <select className='form-control'>
          <option>-- CD Drive (empty) --</option>
          <option>Debian-8.iso</option>
          <option>Windows7.iso</option>
        </select>
        <span className='input-group-btn'>
          <button className='btn btn-secondary'>
            <i className='xo-icon-vm-eject'></i>
          </button>
        </span>
      </div>
    </Col>
    <Col smallSize={5}>
      <div className='input-group'>
        <input type='text' className='form-control'></input>
        <span className='input-group-btn'>
          <button className='btn btn-secondary'>
            <i className='xo-icon-clipboard'>&nbsp;</i>{_('copyToClipboardLabel')}
          </button>
        </span>
      </div>
    </Col>
    <Col smallSize={2}>
      <button className='btn btn-secondary'><i className='xo-icon-vm-keyboard'>&nbsp;</i>{_('ctrlAltDelButtonLabel')}</button>
    </Col>
  </Row>
  <Row className='console'>
    <Col smallSize={12}>
      <NoVnc url={resolveUrl(`consoles/${vm.id}`)} />
      <p><em><i className='xo-icon-info'>&nbsp;</i>{_('tipLabel')} {_('tipConsoleLabel')}</em></p>
    </Col>
  </Row>
</div>
