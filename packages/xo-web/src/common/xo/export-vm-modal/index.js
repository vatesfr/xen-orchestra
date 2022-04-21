import BaseComponent from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'

import _ from '../../intl'
import SelectCompression from '../../select-compression'
import SelectExportFormat from '../../select-export-vm-format'
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
    format: 'xva',
  }

  get value() {
    const compression = this.state.compression === 'zstd' ? 'zstd' : this.state.compression === 'native'
    const format = this.state.format
    return { compression, format }
  }

  render() {
    return (
      <Container>
        <Row>
          <Col mediumSize={6}>
            <strong> {_('exportType')}</strong>
          </Col>
          <Col mediumSize={6}>
            <SelectExportFormat onChange={this.linkState('format')} value={this.state.format} />
          </Col>
        </Row>
        {this.state.format === 'xva' && (
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
        )}
      </Container>
    )
  }
}

ExportVmModalBody.propTypes = {
  vm: PropTypes.object.isRequired,
}
