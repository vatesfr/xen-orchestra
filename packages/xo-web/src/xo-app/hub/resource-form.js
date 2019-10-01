import * as FormGrid from 'form-grid'
import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { Container, Col } from 'grid'
import { find } from 'lodash'
import { SelectPool, SelectSr } from 'select-objects'
import { isSrWritable } from 'xo'
import { error } from 'notification'
import { injectState, provideState } from 'reaclette'

export default decorate([
  provideState({
    initialState: ({ multi }) => ({
      pools: multi ? [] : undefined,
      mapPoolsSrs: {},
    }),
    effects: {
      onChangePool(__, pools) {
        const noDefaultSr = Array.isArray(pools)
          ? pools.some(pool => pool.default_SR === undefined)
          : pools.default_SR === undefined
        if (noDefaultSr) {
          error(_('hubSrErrorTitle'), _('noDefaultSr'))
        } else {
          this.props.onChange({
            pools,
            mapPoolsSrs: this.state.mapPoolsSrs,
          })
          return {
            pools,
          }
        }
      },
      onChangeSr(__, sr) {
        const { mapPoolsSrs, pools } = this.state
        const _mapPoolsSrs = { ...mapPoolsSrs, [sr.$pool]: sr }
        this.props.onChange({
          pools,
          mapPoolsSrs: _mapPoolsSrs,
        })
        return {
          mapPoolsSrs: _mapPoolsSrs,
        }
      },
    },
    computed: {
      isSrSelectDisabled: ({ pools }) =>
        Array.isArray(pools) ? pools.length === 0 : pools === undefined,
      isMultiplePools: ({ pools }) => Array.isArray(pools) && pools.length > 1,
    },
  }),
  injectState,
  ({
    effects,
    install,
    multi,
    state: { isMultiplePools, isSrSelectDisabled, pools, mapPoolsSrs },
    poolPredicate,
  }) => (
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
          value={pools}
        />
      </FormGrid.Row>
      {install && isMultiplePools ? (
        <Container>
          <SingleLineRow>
            <Col size={6}>
              <strong>{_('pool')}</strong>
            </Col>
            <Col size={6}>
              <strong>{_('vdiSr')}</strong>
            </Col>
          </SingleLineRow>
          {pools.map(pool => (
            <SingleLineRow key={pool.uuid} className='mt-1'>
              <Col size={6}>{pool.name_label}</Col>
              <Col size={6}>
                <SelectSr
                  onChange={effects.onChangeSr}
                  predicate={sr => sr.$pool === pool.id && isSrWritable(sr)}
                  value={mapPoolsSrs[pool.id]}
                />
              </Col>
            </SingleLineRow>
          ))}
        </Container>
      ) : (
        install && (
          <FormGrid.Row>
            <label>{_('vmImportToSr')}</label>
            <SelectSr
              disabled={isSrSelectDisabled}
              onChange={effects.onChangeSr}
              predicate={sr =>
                find(pools, { id: sr.$pool }) !== undefined && isSrWritable(sr)
              }
              required
              value={mapPoolsSrs[pools.id]}
            />
          </FormGrid.Row>
        )
      )}
    </Container>
  ),
])
