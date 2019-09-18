import * as FormGrid from 'form-grid'
import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { Container } from 'grid'
import { error } from 'notification'
import { SelectPool } from 'select-objects'
import { injectState, provideState } from 'reaclette'

export default decorate([
  provideState({
    initialState: ({ multi }) => ({
      pools: multi ? [] : undefined,
    }),
    effects: {
      handlePools(__, pools) {
        let noDefaultSrPool
        for (const pool of pools) {
          if (pool.default_SR === undefined) {
            noDefaultSrPool = pool
          }
        }
        if (noDefaultSrPool) {
          error(
            'Error',
            _('hubNoDefaultSrMessage', { pool: noDefaultSrPool.name_label })
          )
        } else {
          this.props.onChange({
            pools,
            pool: pools,
          })
          return {
            pools,
          }
        }
      },
    },
  }),
  injectState,
  ({ effects, install, multi, state, poolPredicate }) => (
    <Container>
      <FormGrid.Row>
        <label>
          {_('vmImportToPool')}
          &nbsp;
          {install && (
            <Tooltip content={_('hubHideInstalledPoolMsg')}>
              <Icon icon='info' />
            </Tooltip>
          )}
        </label>
        <SelectPool
          className='mb-1'
          multi={multi}
          onChange={effects.handlePools}
          predicate={poolPredicate}
          required
          value={state.pools}
        />
      </FormGrid.Row>
    </Container>
  ),
])
