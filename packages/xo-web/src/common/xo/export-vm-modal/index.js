import BaseComponent from 'base-component'
import React from 'react'

import _ from '../../intl'
import { Container, Row, Col } from '../../grid'
import { SelectCompression } from '../../xo-compression'

export default class ExportVmModalBody extends BaseComponent {
  state = {
    compression: '',
  }

  get value() {
    const compression = this.state.compression
    return compression === 'zstd' ? 'zstd' : compression === 'native'
  }

  render() {
    return (
      <Container>
        <Row>
          <Col mediumSize={6}>
            <strong>{_('compression')}</strong>
          </Col>
          <Col mediumSize={6}>
            <SelectCompression
              onChange={this.linkState('compression')}
              value={this.state.compression}
            />
          </Col>
        </Row>
      </Container>
    )
  }
}
