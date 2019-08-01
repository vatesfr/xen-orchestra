import * as FormGrid from 'form-grid'
import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Component from 'base-component'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import PropTypes from 'prop-types'
import React from 'react'
import { Container, Col, Row } from 'grid'
import { importVms, isSrWritable } from 'xo'
import { SizeInput } from 'form'
import {
  createFinder,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
} from 'selectors'
import { connectStore, formatSize, mapPlus, noop } from 'utils'
import { SelectNetwork, SelectPool, SelectSr } from 'select-objects'

export default class Import extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pool: undefined,
      sr: undefined,
      srPredicate: undefined,
    }
  }

  _handleSelectedPool = async pool => {
    await this.setState({
      pool,
      sr: pool.default_SR,
      srPredicate: sr => sr.$pool === this.state.pool.id && isSrWritable(sr),
    })
    this.props.onChange({
      pool,
      sr: this.state.sr,
    })
  }

  _handleSelectedSr = async sr => {
    await this.setState({
      sr: sr === '' ? undefined : sr,
    })
    this.props.onChange({
      sr: sr === '' ? undefined : sr,
      pool: this.state.pool,
    })
  }

  render() {
    const { pool, sr, srPredicate } = this.state

    return (
      <Container>
        <FormGrid.Row>
          <FormGrid.LabelCol>{_('vmImportToPool')}</FormGrid.LabelCol>
          <FormGrid.InputCol>
            <SelectPool
              value={pool}
              onChange={this._handleSelectedPool}
              required
            />
          </FormGrid.InputCol>
        </FormGrid.Row>
        <FormGrid.Row>
          <FormGrid.LabelCol>{_('vmImportToSr')}</FormGrid.LabelCol>
          <FormGrid.InputCol>
            <SelectSr
              disabled={!pool}
              onChange={this._handleSelectedSr}
              predicate={srPredicate}
              required
              value={sr}
            />
          </FormGrid.InputCol>
        </FormGrid.Row>
      </Container>
    )
  }
}
