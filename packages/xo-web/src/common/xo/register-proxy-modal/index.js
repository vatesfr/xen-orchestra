import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Col, Container } from 'grid'
import { Input as DebounceInput } from 'debounce-input-decorator'

export default class RegisterProxyModal extends Component {
  state = {
    address: '',
    authenticationToken: '',
    name: '',
    vmUuid: '',
  }
  get value() {
    return this.state
  }

  render() {
    const { address, authenticationToken, name, vmUuid } = this.state
    return (
      <Container>
        <a href='https://xen-orchestra.com/blog/xo-proxy-a-concrete-guide/' rel='noopener noreferrer'>
          <Icon icon='info' /> {_('xoProxyConcreteGuide')}
        </a>
        <SingleLineRow className='mt-1'>
          <Col size={6}>{_('proxyAuthToken')}</Col>
          <Col size={6}>
            <DebounceInput
              className='form-control'
              onChange={this.linkState('authenticationToken')}
              value={authenticationToken}
            />
          </Col>
        </SingleLineRow>
        <SingleLineRow className='mt-1'>
          <Col size={6}>{_('name')}</Col>
          <Col size={6}>
            <DebounceInput className='form-control' onChange={this.linkState('name')} value={name} />
          </Col>
        </SingleLineRow>
        <SingleLineRow className='mt-1'>
          <Col size={6}>{_('address')}</Col>
          <Col size={6}>
            <DebounceInput
              className='form-control'
              onChange={this.linkState('address')}
              placeholder='192.168.2.20[:4343]'
              value={address}
            />
          </Col>
        </SingleLineRow>
        <SingleLineRow className='mt-1'>
          <Col size={6}>{_('vmUuid')}</Col>
          <Col size={6}>
            <DebounceInput className='form-control' onChange={this.linkState('vmUuid')} value={vmUuid} />
          </Col>
        </SingleLineRow>
        <SingleLineRow className='mt-1'>
          <Col className='text-info'>
            <Icon icon='info' /> {_('proxyOptionalVmUuid')}
          </Col>
        </SingleLineRow>
      </Container>
    )
  }
}
