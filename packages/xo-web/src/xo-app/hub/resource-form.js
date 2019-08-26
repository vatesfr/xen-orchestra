import * as FormGrid from 'form-grid'
import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { Container } from 'grid'
import { SelectPool, SelectSr } from 'select-objects'
import { isSrWritable } from 'xo'
import { injectState, provideState } from 'reaclette'

export default decorate([
  provideState({
    initialState: () => ({
      pool: undefined,
      sr: undefined,
      srPredicate: undefined,
      poolPredicate: undefined,
    }),
    effects: {
      initialize() {
        return {
          // hide pools with already installed template
          poolPredicate: pool => pool.uuid !== this.props.uuid,
        }
      },
      async handleSelectedPool(_, pool) {
        this.state.pool = pool
        this.state.sr = pool.default_SR
        this.state.srPredicate = sr =>
          sr.$pool === this.state.pool.id &&
          this.props.xvaSize < sr.size &&
          isSrWritable(sr)

        this.props.onChange({
          pool,
          sr: this.state.sr,
        })
      },
      async handleSelectedSr(_, sr) {
        this.state.sr = sr === '' ? undefined : sr
        this.props.onChange({
          sr: sr === '' ? undefined : sr,
          pool: this.state.pool,
        })
      },
    },
  }),
  injectState,
  ({ effects, state: { pool, poolPredicate, sr, srPredicate } }) => (
    <Container>
      <FormGrid.Row>
        <label>
          {_('vmImportToPool')}
          &nbsp;
          <Tooltip content={_('hubHideInstalledPoolMsg')}>
            <Icon icon='info' />
          </Tooltip>
        </label>
        <SelectPool
          value={pool}
          onChange={effects.handleSelectedPool}
          predicate={poolPredicate}
          required
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>
          {_('vmImportToSr')}
          &nbsp;
          <Tooltip content={_('hubHideExceedSizeSrMsg')}>
            <Icon icon='info' />
          </Tooltip>
        </label>
        <SelectSr
          disabled={!pool}
          onChange={effects.handleSelectedSr}
          predicate={srPredicate}
          required
          value={sr}
        />
      </FormGrid.Row>
    </Container>
  ),
])
