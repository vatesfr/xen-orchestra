import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Col, Container } from 'grid'
import { SelectSr } from 'select-objects'
import { Toggle } from 'form'

export default class WarmMigrationModal extends Component {
  state = {
    deleteSourceVm: false,
    sr: undefined,
    startDestinationVm: false,
  }
  get value() {
    return this.state
  }

  render() {
    const { deleteSourceVm, sr, startDestinationVm } = this.state
    return (
      <Container>
        <div className='text-info'>
          <Icon icon='info' /> <i>{_('vmWarmMigrationProcessInfo')}</i>
        </div>
        <SingleLineRow className='mt-1'>
          <Col size={6}>{_('destinationSR')}</Col>
          <Col size={6}>
            <SelectSr onChange={this.linkState('sr')} value={sr} />
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
            <Toggle onChange={this.toggleState('startDestinationVm')} value={startDestinationVm} />
          </Col>
        </SingleLineRow>
      </Container>
    )
  }
}
