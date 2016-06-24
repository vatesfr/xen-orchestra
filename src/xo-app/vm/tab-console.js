import _ from 'intl'
import Component from 'base-component'
import CopyToClipboard from 'react-copy-to-clipboard'
import debounce from 'lodash/debounce'
import Icon from 'icon'
import invoke from 'invoke'
import IsoDevice from 'iso-device'
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

  _getRemoteClipboard = clipboard => {
    this.setState({ clipboard })
    this.refs.clipboard.value = clipboard
  }
  _setRemoteClipboard = invoke(() => {
    const setRemoteClipboard = debounce(value => {
      this.setState({ clipboard: value })
      this.refs.noVnc.setClipboard(value)
    }, 200)
    return event => setRemoteClipboard(event.target.value)
  })

  _getClipboardContent = () =>
    this.refs.clipboard && this.refs.clipboard.value

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
            <IsoDevice vm={vm} />
          </Col>
          <Col mediumSize={5}>
            <div className='input-group'>
              <input type='text' className='form-control' ref='clipboard' onChange={this._setRemoteClipboard} />
              <span className='input-group-btn'>
                <CopyToClipboard text={this.state.clipboard || ''}>
                  <button className='btn btn-secondary'>
                    <Icon icon='clipboard' /> {_('copyToClipboardLabel')}
                  </button>
                </CopyToClipboard>
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
            <NoVnc ref='noVnc' url={resolveUrl(`consoles/${vm.id}`)} onClipboardChange={this._getRemoteClipboard} />
            <p><em><Icon icon='info' /> {_('tipLabel')} {_('tipConsoleLabel')}</em></p>
          </Col>
        </Row>
      </Container>
    )
  }
}
