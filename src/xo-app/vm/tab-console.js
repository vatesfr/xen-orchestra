import _ from 'messages'
import Component from 'base-component'
import Icon from 'icon'
import NoVnc from 'react-novnc'
import React from 'react'
import { resolveUrl } from 'xo'
import { Container, Row, Col } from 'grid'
import {
  CpuSparkLines,
  MemorySparkLines,
  VifSparkLines,
  XvdSparkLines
} from 'xo-sparklines'

export default class TabConsole extends Component {
  _sendCtrlAltDel = () => {
    this.refs.noVnc.sendCtrlAltDel()
  }

  render () {
    const {
      statsOverview,
      vm
    } = this.props

    if (vm.power_state !== 'Running') {
      return (
        <p>Console is only available for running VMs.</p>
      )
    }

    return (
      <Container>
        {statsOverview && <Row className='text-xs-center'>
          <Col mediumSize={3}>
            <p>
              <Icon icon='cpu' size={2} />
              {' '}
              <CpuSparkLines data={statsOverview} />
            </p>
          </Col>
          <Col mediumSize={3}>
            <p>
              <Icon icon='memory' size={2} />
              {' '}
              <MemorySparkLines data={statsOverview} />
            </p>
          </Col>
          <Col mediumSize={3}>
            <p>
              <Icon icon='network' size={2} />
              {' '}
              <VifSparkLines data={statsOverview} />
            </p>
          </Col>
          <Col mediumSize={3}>
            <p>
              <Icon icon='disk' size={2} />
              {' '}
              <XvdSparkLines data={statsOverview} />
            </p>
          </Col>
        </Row>}
        <Row>
          <Col mediumSize={5}>
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
          <Col mediumSize={5}>
            <div className='input-group'>
              <input type='text' className='form-control'></input>
              <span className='input-group-btn'>
                <button className='btn btn-secondary'>
                  <Icon icon='clipboard' /> {_('copyToClipboardLabel')}
                </button>
              </span>
            </div>
          </Col>
          <Col mediumSize={2}>
            <button
              className='btn btn-secondary'
              onClick={this._sendCtrlAltDel}
            >
              <Icon icon='vm-keyboard' /> {_('ctrlAltDelButtonLabel')}
            </button>
          </Col>
        </Row>
        <Row className='console'>
          <Col>
            <NoVnc ref='noVnc' url={resolveUrl(`consoles/${vm.id}`)} />
            <p><em><Icon icon='info' /> {_('tipLabel')} {_('tipConsoleLabel')}</em></p>
          </Col>
        </Row>
      </Container>
    )
  }
}
