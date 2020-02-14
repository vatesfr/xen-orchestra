import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Container, Col } from 'grid'
import { createCompare } from 'utils'
import { createSelector } from 'selectors'
import { SelectSr } from 'select-objects'

import { isSrShared } from '../'

const createCompareContainers = poolId =>
  createCompare([_ => _.$pool === poolId, _ => _.type === 'pool'])
const compareSrs = createCompare([isSrShared])

export default class MigrateVdiModalBody extends Component {
  static propTypes = {
    checkSr: PropTypes.func.isRequired,
    pool: PropTypes.string.isRequired,
  }

  get value() {
    return this.state
  }

  _getCompareContainers = createSelector(
    () => this.props.pool,
    poolId => createCompareContainers(poolId)
  )

  _checkSr = createSelector(
    () => this.props.checkSr,
    () => this.state.sr,
    (check, sr) => check(sr)
  )

  render() {
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
        <SingleLineRow className='mt-1'>
          <Col>
            <label>
              <input type='checkbox' onChange={this.linkState('migrateAll')} />{' '}
              {_('vdiMigrateAll')}
            </label>
          </Col>
        </SingleLineRow>
        {!this._checkSr() && (
          <SingleLineRow>
            <Col>
              <span className='text-danger'>
                <Icon icon='alarm' /> {_('warningVdiSr')}
              </span>
            </Col>
          </SingleLineRow>
        )}
      </Container>
    )
  }
}
