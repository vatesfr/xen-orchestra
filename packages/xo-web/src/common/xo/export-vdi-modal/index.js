import BaseComponent from 'base-component'
import React from 'react'

import _ from '../../intl'
import { Container, Row, Col } from '../../grid'
import { Select } from '../../form'

const OPTIONS = [
  {
    label: _('vhd'),
    value: 'vhd',
  },
  {
    label: _('vmdk'),
    value: 'vmdk',
  },
]
export default class ExportVdiModalBody extends BaseComponent {
  state = {
    format: 'vhd',
  }

  get value() {
    return this.state.format
  }

  render() {
    return (
      <Container>
        <Row>
          <Col mediumSize={6}>
            <strong>{_('format')}</strong>
          </Col>
          <Col mediumSize={6}>
            <Select
              labelKey='label'
              options={OPTIONS}
              required
              simpleValue
              onChange={this.linkState('format')}
              value={this.state.format}
            />
          </Col>
        </Row>
      </Container>
    )
  }
}
