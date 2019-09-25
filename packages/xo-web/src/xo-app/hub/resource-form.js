import * as FormGrid from 'form-grid'
import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { Container } from 'grid'
import { SelectPool } from 'select-objects'
import { error } from 'notification'
import { injectState, provideState } from 'reaclette'

export default decorate([
  provideState({
    initialState: ({ multi }) => ({
      pools: multi ? [] : undefined,
    }),
    effects: {
      onChangePool(__, pools) {
        const noDefaultSr = Array.isArray(pools)
          ? pools.some(pool => pool.default_SR === undefined)
          : pools.default_SR === undefined
        if (noDefaultSr) {
          error('Error', _('noDefaultSr'))
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
            <Tooltip content={_('hideInstalledPool')}>
              <Icon icon='info' />
            </Tooltip>
          )}
        </label>
        <SelectPool
          className='mb-1'
          multi={multi}
          onChange={effects.onChangePool}
          predicate={poolPredicate}
          required
          value={state.pools}
        />
      </FormGrid.Row>
    </Container>
  ),
])
