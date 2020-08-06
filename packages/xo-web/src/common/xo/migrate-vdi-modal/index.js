import _ from 'intl'
import Component from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Container, Col } from 'grid'
import { createCompare, createCompareContainers } from 'utils'
import { createSelector } from 'selectors'
import { SelectResourceSetsSr, SelectSr } from 'select-objects'

import { isSrShared, isSrWritable } from '../'

const compareSrs = createCompare([isSrShared])

export default class MigrateVdiModalBody extends Component {
  static propTypes = {
    pool: PropTypes.string.isRequired,
    resourceSet: PropTypes.Object,
    warningBeforeMigrate: PropTypes.func.isRequired,
  }

  get value() {
    return this.state
  }

  _getCompareContainers = createSelector(
    () => this.props.pool,
    createCompareContainers
  )

  _getWarningBeforeMigrate = createSelector(
    () => this.props.warningBeforeMigrate,
    () => this.state.sr,
    (warningBeforeMigrate, sr) => warningBeforeMigrate(sr)
  )

  _getSrPredicate = createSelector(
    () => this.props.pool,
    pool => sr => isSrWritable(sr) && sr.$pool === pool
  )

  render() {
    const { resourceSet } = this.props
    const warningBeforeMigrate = this._getWarningBeforeMigrate()
    const self = resourceSet !== undefined
    const Select = self ? SelectResourceSetsSr : SelectSr
    return (
      <Container>
        <SingleLineRow>
          <Col size={6}>{_('vdiMigrateSelectSr')}</Col>
          <Col size={6}>
            <Select
              compareContainers={
                self ? undefined : this._getCompareContainers()
              }
              compareOptions={self ? undefined : compareSrs}
              onChange={this.linkState('sr')}
              predicate={this._getSrPredicate()}
              required
              resourceSet={resourceSet}
              value={this.state.sr}
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
