import _ from 'messages'
import Icon from 'icon'
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
}) => vm.power_state !== 'Running' ? <p>
  Console is only available for running VMs.
</p> : <div>
  <Row className='text-xs-center'>
    <Col smallSize={3}>
      <p>
        <Icon icon='cpu' size={2} />&nbsp;
        {statsOverview && <CpuSparkLines data={statsOverview} />}
      </p>
    </Col>
    <Col smallSize={3}>
      <p>
        <Icon icon='memory' size={2} />&nbsp;
        {statsOverview && <MemorySparkLines data={statsOverview} />}
      </p>
    </Col>
    <Col smallSize={3}>
      <p>
        <Icon icon='network' size={2} />&nbsp;
        {statsOverview && <VifSparkLines data={statsOverview} />}
      </p>
    </Col>
    <Col smallSize={3}>
      <p>
        <Icon icon='disk' size={2} />&nbsp;
        {statsOverview && <XvdSparkLines data={statsOverview} />}
      </p>
    </Col>
  </Row>
  <Row>
    <Col smallSize={5}>
      {/* TODO: insert real ISO selector, CtrlAltSuppr button and Clipboard */}
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
      <NoVnc url={resolveUrl(`consoles/${vm.id}`)} />
      <p><em><Icon icon='info' /> {_('tipLabel')} {_('tipConsoleLabel')}</em></p>
    </Col>
  </Row>
</div>
