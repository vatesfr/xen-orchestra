import _ from 'intl'
import Button from 'button'
import Component from 'base-component'
import CopyToClipboard from 'react-copy-to-clipboard'
import debounce from 'lodash/debounce'
import Icon from 'icon'
import invoke from 'invoke'
import IsoDevice from 'iso-device'
import NoVnc from 'react-novnc'
import React from 'react'
import Tooltip from 'tooltip'
import { resolveUrl, isVmRunning } from 'xo'
import { Container, Row, Col } from 'grid'
import {
  CpuSparkLines,
  MemorySparkLines,
  VifSparkLines,
  XvdSparkLines
} from 'xo-sparklines'

export default class TabConsole extends Component {
  state = { scale: 1 }

  componentWillReceiveProps (props) {
    if (isVmRunning(this.props.vm) && !isVmRunning(props.vm) && this.state.minimalLayout) {
      this._toggleMinimalLayout()
    }
  }
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

  _toggleMinimalLayout = () => {
    this.props.toggleHeader()
    this.setState({ minimalLayout: !this.state.minimalLayout })
  }

  render () {
    const {
      statsOverview,
      vm
    } = this.props
    const {
      minimalLayout,
      scale
    } = this.state

    if (!isVmRunning(vm)) {
      return (
        <Container>
          <p>Console is only available for running VMs.</p>
        </Container>
      )
    }

    return (
      <Container>
        {!minimalLayout && statsOverview && <Row className='text-xs-center'>
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
          <Col mediumSize={3}>
            <IsoDevice vm={vm} />
          </Col>
          <Col mediumSize={3}>
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
            <Button
              onClick={this._sendCtrlAltDel}
            >
              <Icon icon='vm-keyboard' /> {_('ctrlAltDelButtonLabel')}
            </Button>
          </Col>
          <Col mediumSize={3}>
            <input
              className='form-control'
              max={3}
              min={0.1}
              onChange={this.linkState('scale')}
              step={0.1}
              type='range'
              value={scale}
            />
          </Col>
          <Col mediumSize={1}>
            <Tooltip content={minimalLayout ? _('showHeaderTooltip') : _('hideHeaderTooltip')}>
              <Button onClick={this._toggleMinimalLayout}>
                <Icon icon={minimalLayout ? 'caret' : 'caret-up'} />
              </Button>
            </Tooltip>
          </Col>
        </Row>
        <Row className='console'>
          <Col>
            <NoVnc
              onClipboardChange={this._getRemoteClipboard}
              ref='noVnc'
              scale={scale}
              url={resolveUrl(`consoles/${vm.id}`)}
            />
          </Col>
        </Row>
      </Container>
    )
  }
}
