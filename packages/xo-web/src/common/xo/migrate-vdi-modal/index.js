import _ from 'intl'
import Component from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Container, Col } from 'grid'
import { createCompare, createCompareContainers } from 'utils'
import { createSelector } from 'selectors'
import { SelectResourceSetsSr, SelectSr as SelectAnySr } from 'select-objects'
import { Toggle } from 'form'

import { isSrIso, isSrShared, isSrWritable } from '../'

const compareSrs = createCompare([isSrShared])

export default class MigrateVdiModalBody extends Component {
  static propTypes = {
    nSnapshots: PropTypes.number,
    pool: PropTypes.string.isRequired,
    resourceSet: PropTypes.object,
    warningBeforeMigrate: PropTypes.func.isRequired,
  }

  get value() {
    return this.state
  }

  state = {
    removeSnapshotsBeforeMigrating: false,
  }

  _getCompareContainers = createSelector(() => this.props.pool, createCompareContainers)

  _getWarningBeforeMigrate = createSelector(
    () => this.props.warningBeforeMigrate,
    () => this.state.sr,
    (warningBeforeMigrate, sr) => warningBeforeMigrate(sr)
  )

  _getSrPredicate = createSelector(
    () => this.props.pool,
    () => this.props.isoSr,
    (pool, isoSr) => sr => (isoSr ? isSrIso(sr) : isSrWritable(sr)) && sr.$pool === pool
  )

  render() {
    const { nSnapshots, resourceSet } = this.props
    const warningBeforeMigrate = this._getWarningBeforeMigrate()
    const SelectSr = resourceSet !== undefined ? SelectResourceSetsSr : SelectAnySr
    return (
      <Container>
        <SingleLineRow>
          <Col size={6}>{_('vdiMigrateSelectSr')}</Col>
          <Col size={6}>
            <SelectSr
              compareContainers={this._getCompareContainers()}
              compareOptions={compareSrs}
              onChange={this.linkState('sr')}
              predicate={this._getSrPredicate()}
              required
              resourceSet={resourceSet}
              value={this.state.sr}
            />
          </Col>
        </SingleLineRow>
        <SingleLineRow>
          <Col size={6}>{_('vdiMigrateWithoutSnapshots')}</Col>
          <Col size={6}>
            <Toggle
              disabled={nSnapshots === 0}
              value={this.state.removeSnapshotsBeforeMigrating}
              onChange={this.toggleState('removeSnapshotsBeforeMigrating')}
            />
          </Col>
        </SingleLineRow>
        {warningBeforeMigrate !== null && (
          <SingleLineRow>
            <Col>{warningBeforeMigrate}</Col>
          </SingleLineRow>
        )}
      </Container>
    )
  }
}
