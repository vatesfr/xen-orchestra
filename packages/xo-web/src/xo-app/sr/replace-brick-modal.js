import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { SelectSr } from 'select-objects'
import { Toggle, SizeInput } from 'form'
import { Container, Row, Col } from 'grid'
import { createSelector } from 'selectors'

export default class ReplaceBrickModalBody extends Component {
  get value() {
    return this.state
  }

  _getSrPredicate = createSelector(
    () => this.props.vm,
    () => this.state.onSameVm,
    (vm, onSameVm) => {
      if (vm === undefined) {
        return sr => sr.SR_type === 'lvm'
      }

      return onSameVm
        ? sr => sr.$container === vm.$container && sr.SR_type === 'lvm'
        : sr => sr.$pool === vm.$pool && sr.SR_type === 'lvm'
    }
  )

  _toggleOnSameVm = () =>
    this.setState({
      onSameVm: !this.state.onSameVm,
      sr: undefined,
    })

  _selectSr = sr => {
    this.setState({
      sr,
      brickSize: sr.size - sr.physical_usage,
    })
  }

  render() {
    return (
      <Container>
        {this.props.vm !== undefined && (
          <Row className='mb-1'>
            <Col size={6}>
              <strong>{_('xosanOnSameVm')}</strong>
            </Col>
            <Col size={6}>
              <Toggle onChange={this._toggleOnSameVm} value={this.state.onSameVm} />
            </Col>
          </Row>
        )}
        <Row className='mb-1'>
          <Col size={6}>
            <strong>{_('xosanUnderlyingStorage')}</strong>
          </Col>
          <Col size={6}>
            <SelectSr onChange={this._selectSr} predicate={this._getSrPredicate()} value={this.state.sr} />
          </Col>
        </Row>
        <Row className='mb-1'>
          <Col size={6}>
            <strong>{_('xosanBrickSize')}</strong>
          </Col>
          <Col size={6}>
            <SizeInput onChange={this.linkState('brickSize')} value={this.state.brickSize} />
          </Col>
        </Row>
      </Container>
    )
  }
}
