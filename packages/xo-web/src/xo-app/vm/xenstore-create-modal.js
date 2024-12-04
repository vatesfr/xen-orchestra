import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Container, Col } from 'grid'

const XENSTORE_PREFIX = 'vm-data/'

export default class XenstoreCreateModal extends Component {
  state = {
    key: XENSTORE_PREFIX,
    value: undefined,
  }

  get value() {
    return { [this.state.key.trim()]: this.state.value.trim() }
  }

  onKeyChange = ({ target: { value } }) => {
    let str = value
    if (!str.startsWith(XENSTORE_PREFIX)) {
      str = XENSTORE_PREFIX + value
    }
    this.setState({ key: str })
  }

  onValueChange = ({ target: { value } }) => {
    this.setState({ value })
  }

  render() {
    return (
      <Container>
        <i className='text-info'>
          <Icon icon='info' /> {_('vmDataNamespaceMandatory')}
        </i>
        <SingleLineRow>
          <Col size={6}>{_('key')}</Col>
          <Col size={6}>
            <input className='form-control' onChange={this.onKeyChange} type='text' value={this.state.key} />
          </Col>
        </SingleLineRow>
        <SingleLineRow>
          <Col size={6}>{_('value')}</Col>
          <Col size={6}>
            <input className='form-control' type='text' onChange={this.onValueChange} value={this.state.value} />
          </Col>
        </SingleLineRow>
      </Container>
    )
  }
}
