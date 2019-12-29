import * as FormGrid from 'form-grid'
import _ from 'intl'
import decorate from 'apply-decorators'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { Container, Col } from 'grid'
import { isEmpty, sortBy } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { isSrWritable } from 'xo'
import { Pool } from 'render-xo-item'
import { SelectPool, SelectSr } from 'select-objects'

export default decorate([
  provideState({
    effects: {
      onChangePools(__, pools) {
        const { multi, onChange, value } = this.props
        onChange({
          ...value,
          [multi ? 'pools' : 'pool']: pools,
        })
      },
      onChangeSr(__, sr) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          mapPoolsSrs: {
            ...value.mapPoolsSrs,
            [sr.$pool]: sr.id,
          },
        })
      },
    },
    computed: {
      sortedPools: (_, { value }) => sortBy(value.pools, 'name_label'),
    },
  }),
  injectState,
  ({ effects, install, multi, poolPredicate, state, value }) => (
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
          onChange={effects.onChangePools}
          predicate={poolPredicate}
          required
          value={multi ? value.pools : value.pool}
        />
      </FormGrid.Row>
      {install && multi && !isEmpty(value.pools) && (
        <div>
          <SingleLineRow>
            <Col size={6}>
              <strong>{_('pool')}</strong>
            </Col>
            <Col size={6}>
              <strong>{_('sr')}</strong>
            </Col>
          </SingleLineRow>
          <hr />
          {state.sortedPools.map(pool => (
            <SingleLineRow key={pool.id} className='mt-1'>
              <Col size={6}>
                <Pool id={pool.id} link />
              </Col>
              <Col size={6}>
                <SelectSr
                  onChange={effects.onChangeSr}
                  predicate={sr => sr.$pool === pool.id && isSrWritable(sr)}
                  required
                  value={defined(value.mapPoolsSrs[pool.id], pool.default_SR)}
                />
              </Col>
            </SingleLineRow>
          ))}
        </div>
      )}
    </Container>
  ),
])
