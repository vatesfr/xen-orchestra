import _ from 'intl'
import Component from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Container, Col } from 'grid'
import { NumericDate } from 'utils'
import { Select } from 'form'

export default class DeleteMetadataBackupModalBody extends Component {
  static propTypes = {
    backups: PropTypes.array,
  }

  get value() {
    return this.state.backups
  }

  _optionRenderer = ({ timestamp }) => <NumericDate timestamp={timestamp} />

  render() {
    return (
      <Container>
        <SingleLineRow>
          <Col size={6}>{_('deleteBackupsSelect')}</Col>
          <Col size={6}>
            <Select
              labelKey='timestamp'
              multi
              onChange={this.linkState('backups')}
              optionRenderer={this._optionRenderer}
              options={this.props.backups}
              required
              value={this.state.backups}
              valueKey='id'
            />
          </Col>
        </SingleLineRow>
      </Container>
    )
  }
}
