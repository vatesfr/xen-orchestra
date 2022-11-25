import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Col, Container } from 'grid'
import { Input as DebounceInput } from 'debounce-input-decorator'

export default class ConnectProxyModal extends Component {
  state = {
    authenticationToken: undefined,
    name: undefined,
    address: undefined,
    vmUuid: undefined,
  }
  get value() {
    return this.state
  }

  render() {
    const { address, authenticationToken, name, vmUuid } = this.state
    return (
      <Container>
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
            <DebounceInput className='form-control' onChange={this.linkState('address')} value={address} />
          </Col>
        </SingleLineRow>
        {_('or')}
        <SingleLineRow>
          <Col size={6}>{_('vmUuid')}</Col>
          <Col size={6}>
            <DebounceInput className='form-control' onChange={this.linkState('vmUuid')} value={vmUuid} />
          </Col>
        </SingleLineRow>
      </Container>
    )
  }
}
