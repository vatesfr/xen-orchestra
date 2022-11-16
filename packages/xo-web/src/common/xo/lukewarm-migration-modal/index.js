import SingleLineRow from '../../single-line-row'
import Component from 'base-component'
import { Toggle } from 'form'
import { Col, Container } from 'grid'
import _ from 'intl'
import React from 'react'
import { SelectSr } from 'select-objects'

export default class LukewarmMigrationModal extends Component {
  state = {
    sr: undefined,
    deleteSourceVm: false,
    startMigratedVm: false,
  }
  get value() {
    return this.state
  }

  render() {
    const { deleteSourceVm, startMigratedVm } = this.state
    return (
      <Container>
        <SingleLineRow>
          <Col size={6}>{_('destinationSR')}</Col>
          <Col size={6}>
            <SelectSr onChange={this.linkState('sr')} />
          </Col>
        </SingleLineRow>
        <SingleLineRow className='mt-1'>
          <Col size={6}>{_('deleteSourceVm')}</Col>
          <Col size={6}>
            <Toggle onChange={this.toggleState('deleteSourceVm')} value={deleteSourceVm} />
          </Col>
        </SingleLineRow>
        <SingleLineRow className='mt-1'>
          <Col size={6}>{_('startMigratedVm')}</Col>
          <Col size={6}>
            <Toggle onChange={this.toggleState('startMigratedVm')} value={startMigratedVm} />
          </Col>
        </SingleLineRow>
      </Container>
    )
  }
}
