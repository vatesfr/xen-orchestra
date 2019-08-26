import * as FormGrid from 'form-grid'
import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { Container } from 'grid'
import { SelectPool, SelectSr } from 'select-objects'
import { error } from 'notification'
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
        return { poolPredicate: pool => pool.uuid !== this.props.uuid }
      },
      async handleSelectedPool(_, pool) {
        this.state.pool = pool
        this.state.sr = pool.default_SR
        this.state.srPredicate = sr =>
          sr.$pool === this.state.pool.id && isSrWritable(sr)

        this.props.onChange({
          pool,
          sr: this.state.sr,
        })
      },
      async handleSelectedSr(_, sr) {
        if (this.props.xvaSize > sr.size) {
          error('Select SR', 'Not Enough Free Disk Space')
        } else {
          this.state.sr = sr === '' ? undefined : sr
          this.props.onChange({
            sr: sr === '' ? undefined : sr,
            pool: this.state.pool,
          })
        }
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
        <label>{_('vmImportToSr')}</label>
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
