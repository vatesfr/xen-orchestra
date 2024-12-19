import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Container, Col } from 'grid'

export const XENSTORE_PREFIX = 'vm-data/'

export default class XenStoreCreateModal extends Component {
  state = {
    key: undefined,
    value: undefined,
  }

  get value() {
    if (this.state.key === undefined || this.state.value === undefined) {
      return
    }

    return { [XENSTORE_PREFIX + this.state.key.trim()]: this.state.value.trim() }
  }

  render() {
    return (
      <Container>
        <SingleLineRow className='mt-1'>
          <Col size={4}>
            <strong>{_('key')}</strong>
          </Col>
          <Col size={8} className='input-group'>
            <span className='input-group-addon'>{XENSTORE_PREFIX}</span>
            <input className='form-control' onChange={this.linkState('key')} type='text' value={this.state.key} />
          </Col>
        </SingleLineRow>
        <SingleLineRow className='mt-1'>
          <Col size={4}>
            <strong>{_('value')}</strong>
          </Col>
          <Col size={8} className='input-group'>
            <input className='form-control' onChange={this.linkState('value')} type='text' value={this.state.value} />
          </Col>
        </SingleLineRow>
      </Container>
    )
  }
}
