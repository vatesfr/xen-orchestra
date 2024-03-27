import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import SingleLineRow from 'single-line-row'
import StateButton from 'state-button'
import { Container, Col, Row } from 'grid'
import { NumericDate } from 'utils'
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

  _optionRenderer = ({ timestamp }) => <NumericDate timestamp={timestamp} />

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
        {this.props.type !== 'XO' && [
          <Row className='mt-1' key='select'>
            <SelectPool onChange={this.linkState('pool')} required value={this.state.pool} />
          </Row>,
          <SingleLineRow key='message'>{restorationWarning}</SingleLineRow>,
        ]}
      </Container>
    )
  }
}

export class RestoreMetadataBackupsBulkModalBody extends Component {
  static propTypes = {
    nMetadataBackups: PropTypes.number,
    poolMetadataBackups: PropTypes.array,
  }

  state = { latest: true }

  get value() {
    return this.state
  }

  render() {
    return (
      <Container>
        <Row>
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
        </Row>
        {this.props.poolMetadataBackups.map(value => (
          <Container key={value.id} className='mt-1'>
            <SingleLineRow>
              <Col size={6}>{value.first.jobName}</Col>
              <Col size={6}>
                <SelectPool onChange={this.linkState(value.id)} required value={this.state[value.id]} />
              </Col>
            </SingleLineRow>
          </Container>
        ))}
        {restorationWarning}
      </Container>
    )
  }
}
