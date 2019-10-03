import * as FormGrid from 'form-grid'
import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { Container, Col } from 'grid'
import { differenceBy, isEmpty, sortBy } from 'lodash'
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
  }),
  injectState,
  ({
    effects,
    install,
    multi,
    state: { pools, mapPoolsSrs },
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
      {install && multi && !isEmpty(pools) && (
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
          {sortBy(pools, 'name_label').map(pool => (
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
      )}
    </Container>
  ),
])
