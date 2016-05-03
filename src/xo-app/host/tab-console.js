import _ from 'messages'
import Icon from 'icon'
import NoVnc from 'react-novnc'
import React from 'react'
import { resolveUrl } from 'xo'
import { Row, Col } from 'grid'

import {
  CpuSparkLines,
  MemorySparkLines,
  PifSparkLines,
  LoadSparkLines
} from 'xo-sparklines'

export default ({
  vmController,
  host,
  statsOverview
}) => <div>
  <Row className='text-xs-center'>
    <Col mediumSize={3}>
      <Icon icon='cpu' size={2} />&nbsp;
      {statsOverview && <CpuSparkLines data={statsOverview} />}
    </Col>
    <Col mediumSize={3}>
      <Icon icon='memory' size={2} />&nbsp;
      {statsOverview && <MemorySparkLines data={statsOverview} />}
    </Col>
    <Col mediumSize={3}>
      <Icon icon='network' size={2} />&nbsp;
      {statsOverview && <PifSparkLines data={statsOverview} />}
    </Col>
    <Col mediumSize={3}>
      <Icon icon='disk' size={2} />&nbsp;
      {statsOverview && <LoadSparkLines data={statsOverview} />}
    </Col>
  </Row>
  <br />
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
            <Icon icon='vm-eject' />
          </button>
        </span>
      </div>
    </Col>
    <Col smallSize={5}>
      <div className='input-group'>
        <input type='text' className='form-control'></input>
        <span className='input-group-btn'>
          <button className='btn btn-secondary'>
            <Icon icon='clipboard' /> {_('copyToClipboardLabel')}
          </button>
        </span>
      </div>
    </Col>
    <Col smallSize={2}>
      <button className='btn btn-secondary'><Icon icon='vm-keyboard' /> {_('ctrlAltDelButtonLabel')}</button>
    </Col>
  </Row>
  <Row className='console'>
    <Col smallSize={12}>
      <NoVnc url={resolveUrl(`consoles/${vmController.id}`)} />
      <p><em><Icon icon='info' /> {_('tipLabel')} {_('tipConsoleLabel')}</em></p>
    </Col>
  </Row>
</div>
