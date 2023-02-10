import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import SingleLineRow from 'single-line-row'
import StateButton from 'state-button'
import { Container, Col, Row } from 'grid'
import { FormattedDate } from 'react-intl'
import { Select } from 'form'
import { SelectPool } from 'select-objects'

const restorationWarning = (
  <p className='text-warning mt-1'>
    <Icon icon='alarm' /> {_('restoreMetadataBackupWarning')}
  </p>
)

export default class RestoreMetadataBackupModalBody extends Component {
  static propTypes = {
    backups: PropTypes.array,
    type: PropTypes.string,
  }

  get value() {
    return this.state
  }

  _optionRenderer = ({ timestamp }) => (
    <FormattedDate
      value={new Date(timestamp)}
      month='long'
      day='numeric'
      year='numeric'
      hour='2-digit'
      minute='2-digit'
      second='2-digit'
    />
  )

  render() {
    return (
      <Container>
        <Row>
          <Col size={6}>{_('chooseBackup')}</Col>
          <Col size={6}>
            <Select
              labelKey='timestamp'
              onChange={this.linkState('backup')}
              optionRenderer={this._optionRenderer}
              options={this.props.backups}
              required
              value={this.state.backup}
              valueKey='id'
            />
          </Col>
        </Row>
        <br />
        <Row>
          <SelectPool onChange={this.linkState('pool')} required value={this.state.pool} />
        </Row>
        {this.props.type !== 'XO' && <SingleLineRow>{restorationWarning}</SingleLineRow>}
      </Container>
    )
  }
}

export class RestoreMetadataBackupsBulkModalBody extends Component {
  static propTypes = {
    nMetadataBackups: PropTypes.number,
  }

  state = { latest: true }

  get value() {
    return this.state.latest
  }

  render() {
    return (
      <div>
        {_('bulkRestoreMetadataBackupMessage', {
          nMetadataBackups: this.props.nMetadataBackups,
          oldestOrLatest: (
            <StateButton
              disabledLabel={_('oldest')}
              enabledLabel={_('latest')}
              handler={this.toggleState('latest')}
              state={this.state.latest}
            />
          ),
        })}
        {restorationWarning}
      </div>
    )
  }
}
