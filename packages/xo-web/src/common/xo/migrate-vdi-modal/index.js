import _ from 'intl'
import Component from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Container, Col } from 'grid'
import { createCompare, createCompareContainers } from 'utils'
import { createSelector } from 'selectors'
import { SelectSr } from 'select-objects'

import { isSrShared } from '../'

const compareSrs = createCompare([isSrShared])

export default class MigrateVdiModalBody extends Component {
  static propTypes = {
    pool: PropTypes.string.isRequired,
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

  render() {
    const warningBeforeMigrate = this._getWarningBeforeMigrate()
    return (
      <Container>
        <SingleLineRow>
          <Col size={6}>{_('vdiMigrateSelectSr')}</Col>
          <Col size={6}>
            <SelectSr
              compareContainers={this._getCompareContainers()}
              compareOptions={compareSrs}
              onChange={this.linkState('sr')}
              required
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
