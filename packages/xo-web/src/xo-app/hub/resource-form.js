import * as FormGrid from 'form-grid'
import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { Container, Col } from 'grid'
import { differenceBy, find, first } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { isSrWritable } from 'xo'
import { Pool } from 'render-xo-item'
import { SelectPool, SelectSr } from 'select-objects'

export default decorate([
  provideState({
    initialState: ({ multi }) => ({
      pools: multi ? [] : undefined,
      mapPoolsSrs: {},
    }),
    effects: {
      onChangePool(__, pools) {
        const _defaultSrByPool = this.state.mapPoolsSrs
        if (Array.isArray(pools)) {
          for (const pool of differenceBy(pools, this.state.pools, 'id')) {
            _defaultSrByPool[pool.id] = pool.default_SR
          }
        } else {
          _defaultSrByPool[pools.id] = pools.default_SR
        }
        this.props.onChange({
          pools,
          mapPoolsSrs: _defaultSrByPool,
        })
        return {
          pools,
          mapPoolsSrs: _defaultSrByPool,
        }
      },
      onChangeSr(__, sr) {
        const { mapPoolsSrs, pools } = this.state
        const _mapPoolsSrs = { ...mapPoolsSrs, [sr.$pool]: sr.id }
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
        <div>
          <SingleLineRow>
            <Col size={6}>
              <strong>{_('pool')}</strong>
            </Col>
            <Col size={6}>
              <strong>{_('vdiSr')}</strong>
            </Col>
          </SingleLineRow>
          <hr />
          {pools.map(pool => (
            <SingleLineRow key={pool.uuid} className='mt-1'>
              <Col size={6}>
                <Pool id={pool.id} link />
              </Col>
              <Col size={6}>
                <SelectSr
                  onChange={effects.onChangeSr}
                  predicate={sr => sr.$pool === pool.id && isSrWritable(sr)}
                  required
                  value={mapPoolsSrs[pool.id]}
                />
              </Col>
            </SingleLineRow>
          ))}
        </div>
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
              value={
                pools.length > 0 ? mapPoolsSrs[first(pools).id] : undefined
              }
            />
          </FormGrid.Row>
        )
      )}
    </Container>
  ),
])
