import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { SelectSr } from 'select-objects'
import { SizeInput } from 'form'
import { Container, Row, Col } from 'grid'
import { createSelector } from 'selectors'
import { map, min } from 'lodash'

export default class AddSubvolumeModalBody extends Component {
  get value() {
    return this.state
  }

  _getSrPredicate = createSelector(
    () => this.props.sr.$pool,
    poolId => sr => sr.SR_type === 'lvm' && sr.$pool === poolId
  )

  _selectSrs = srs => {
    this.setState({
      srs,
      brickSize: min(map(srs, sr => sr.size - sr.physical_usage)),
    })
  }

  render() {
    return (
      <Container>
        <Row className='mb-1'>
          <Col size={6}>{_('xosanSelectNSrs', { nSrs: this.props.subvolumeSize })}</Col>
          <Col size={6}>
            <SelectSr multi onChange={this._selectSrs} predicate={this._getSrPredicate()} value={this.state.srs} />
          </Col>
        </Row>
        <Row className='mb-1'>
          <Col size={6}>{_('xosanSize')}</Col>
          <Col size={6}>
            <SizeInput onChange={this.linkState('brickSize')} required value={this.state.brickSize} />
          </Col>
        </Row>
      </Container>
    )
  }
}
