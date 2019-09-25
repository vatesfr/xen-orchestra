import BaseComponent from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'

import _ from '../../intl'
import SelectCompression from '../../select-compression'
import { connectStore } from '../../utils'
import { Container, Row, Col } from '../../grid'
import { createGetObject, createSelector } from '../../selectors'

@connectStore(
  {
    isZstdSupported: createSelector(
      createGetObject((_, { vm }) => vm.$container),
      container => container === undefined || container.zstdSupported
    ),
  },
  { withRef: true }
)
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
              showZstd={this.props.isZstdSupported}
              value={this.state.compression}
            />
          </Col>
        </Row>
      </Container>
    )
  }
}

ExportVmModalBody.propTypes = {
  vm: PropTypes.object.isRequired,
}
