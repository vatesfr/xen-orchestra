import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Component from 'base-component'
import CopyToClipboard from 'react-copy-to-clipboard'
import debounce from 'lodash/debounce'
import getEventValue from 'get-event-value'
import Icon from 'icon'
import invoke from 'invoke'
import IsoDevice from 'iso-device'
import NoVnc from 'react-novnc'
import React from 'react'
import Tooltip from 'tooltip'
import { isVmRunning, resolveUrl } from 'xo'
import { Col, Container, Row } from 'grid'
import { confirm } from 'modal'
import {
  CpuSparkLines,
  MemorySparkLines,
  NetworkSparkLines,
  XvdSparkLines,
} from 'xo-sparklines'

class SendToClipboard extends Component {
  componentWillMount() {
    this.setState({ value: this.props.clipboard })
  }

  get value() {
    return this.state.value
  }

  _selectContent = ref => {
    if (ref !== null) {
      ref.select()
    }
  }

  render() {
    return (
      <div>
        <textarea
          className='form-control'
          onChange={this.linkState('value')}
          ref={this._selectContent}
          rows={10}
          value={this.state.value}
        />
      </div>
    )
  }
}

export default class TabConsole extends Component {
  state = { clipboard: '', scale: 1 }

  componentWillReceiveProps(props) {
    if (
      isVmRunning(this.props.vm) &&
      !isVmRunning(props.vm) &&
      this.state.minimalLayout
    ) {
      this._toggleMinimalLayout()
    }
  }
  _sendCtrlAltDel = () => {
    this.refs.noVnc.sendCtrlAltDel()
  }

  _getRemoteClipboard = clipboard => {
    this.setState({ clipboard })
  }

  _setRemoteClipboard = invoke(() => {
    const setRemoteClipboard = debounce(value => {
      this.setState({ clipboard: value })
      this.refs.noVnc.setClipboard(value)
    }, 200)
    return event => setRemoteClipboard(getEventValue(event))
  })

  _openClipboardModal = async () =>
    this._setRemoteClipboard(
      await confirm({
        icon: 'multiline-clipboard',
        title: _('sendToClipboard'),
        body: <SendToClipboard clipboard={this.state.clipboard} />,
      })
    )

  _toggleMinimalLayout = () => {
    this.props.toggleHeader()
    this.setState({ minimalLayout: !this.state.minimalLayout })
  }

  render() {
    const { statsOverview, vm } = this.props
    const { minimalLayout, scale } = this.state

    if (!isVmRunning(vm)) {
      return (
        <Container>
          <p>Console is only available for running VMs.</p>
        </Container>
      )
    }

    return (
      <Container>
        {!minimalLayout && statsOverview && (
          <Row className='text-xs-center'>
            <Col mediumSize={3}>
              <p>
                <Icon icon='cpu' size={2} />{' '}
                <CpuSparkLines data={statsOverview} />
              </p>
            </Col>
            <Col mediumSize={3}>
              <p>
                <Icon icon='memory' size={2} />{' '}
                <MemorySparkLines data={statsOverview} />
              </p>
            </Col>
            <Col mediumSize={3}>
              <p>
                <Icon icon='network' size={2} />{' '}
                <NetworkSparkLines data={statsOverview} />
              </p>
            </Col>
            <Col mediumSize={3}>
              <p>
                <Icon icon='disk' size={2} />{' '}
                <XvdSparkLines data={statsOverview} />
              </p>
            </Col>
          </Row>
        )}
        <Row>
          <Col mediumSize={3}>
            <IsoDevice vm={vm} />
          </Col>
          <Col mediumSize={3}>
            <div className='input-group'>
              <span className='input-group-btn'>
                <ActionButton
                  handler={this._openClipboardModal}
                  icon='multiline-clipboard'
                  tooltip={_('multilineCopyToClipboard')}
                />
              </span>
              <input
                className='form-control'
                onChange={this._setRemoteClipboard}
                type='text'
                value={this.state.clipboard}
              />
              <span className='input-group-btn'>
                <CopyToClipboard text={this.state.clipboard}>
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
            <Tooltip
              content={
                minimalLayout ? _('showHeaderTooltip') : _('hideHeaderTooltip')
              }
            >
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
