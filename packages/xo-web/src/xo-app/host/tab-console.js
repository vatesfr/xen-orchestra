import _ from 'intl'
import Button from 'button'
import Component from 'base-component'
import CopyToClipboard from 'react-copy-to-clipboard'
import debounce from 'lodash/debounce'
import Icon from 'icon'
import invoke from 'invoke'
import NoVnc from 'react-novnc'
import React from 'react'
import { resolveUrl } from 'xo'
import { Container, Row, Col } from 'grid'

import { CpuSparkLines, MemorySparkLines, NetworkSparkLines, LoadSparkLines } from 'xo-sparklines'

export default class extends Component {
  state = { scale: 1 }

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

  _getClipboardContent = () => this.refs.clipboard && this.refs.clipboard.value

  _onChangeScaleValue = event => {
    const value = event.target.value
    this.setState({ scale: value / 100 })
  }

  render() {
    const { vmController, statsOverview } = this.props
    const { scale } = this.state

    return (
      <Container>
        {statsOverview && (
          <Row className='text-xs-center'>
            <Col mediumSize={3}>
              <Icon icon='cpu' size={2} /> <CpuSparkLines data={statsOverview} />
            </Col>
            <Col mediumSize={3}>
              <Icon icon='memory' size={2} /> <MemorySparkLines data={statsOverview} />
            </Col>
            <Col mediumSize={3}>
              <Icon icon='network' size={2} /> <NetworkSparkLines data={statsOverview} />
            </Col>
            <Col mediumSize={3}>
              <Icon icon='disk' size={2} /> <LoadSparkLines data={statsOverview} />
            </Col>
          </Row>
        )}
        <br />
        <Row>
          <Col mediumSize={7}>
            <div className='input-group'>
              <input type='text' className='form-control' ref='clipboard' onChange={this._setRemoteClipboard} />
              <span className='input-group-btn'>
                <CopyToClipboard text={this.state.clipboard || ''}>
                  <Button>
                    <Icon icon='clipboard' /> {_('copyToClipboardLabel')}
                  </Button>
                </CopyToClipboard>
              </span>
            </div>
          </Col>
          <Col mediumSize={2}>
            <Button onClick={this._sendCtrlAltDel}>
              <Icon icon='vm-keyboard' /> {_('ctrlAltDelButtonLabel')}
            </Button>
          </Col>
          <Col mediumSize={2}>
            <input
              className='form-control'
              max={3}
              min={0.1}
              type='range'
              onChange={this.linkState('scale')}
              step={0.1}
              value={scale}
            />
          </Col>
          <Col mediumSize={1}>
            <input
              className='form-control'
              onChange={this._onChangeScaleValue}
              step='1'
              type='number'
              value={Math.round(this.state.scale * 100)}
              min={1}
              max={300}
            />
          </Col>
        </Row>
        <Row className='console'>
          <Col>
            <NoVnc
              scale={scale}
              ref='noVnc'
              url={resolveUrl(`consoles/${vmController.id}`)}
              onClipboardChange={this._getRemoteClipboard}
            />
          </Col>
        </Row>
      </Container>
    )
  }
}
