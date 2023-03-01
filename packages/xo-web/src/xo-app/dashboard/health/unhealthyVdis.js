import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { Card, CardHeader, CardBlock } from 'card'
import { connectStore } from 'utils'
import { Col, Row } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { injectState, provideState } from 'reaclette'
import { forEach, isEmpty, map, size } from 'lodash'
import { Sr, Vdi } from 'render-xo-item'
import { subscribeSrsUnhealthyVdiChainsLength, VDIS_TO_COALESCE_LIMIT } from 'xo'

const COLUMNS = [
  {
    itemRenderer: (srId, { vdisHealthBySr }) => (
      <div>
        <Sr id={srId} link />{' '}
        {size(vdisHealthBySr[srId].unhealthyVdis) >= VDIS_TO_COALESCE_LIMIT && (
          <Tooltip content={_('srVdisToCoalesceWarning', { limitVdis: VDIS_TO_COALESCE_LIMIT })}>
            <span className='text-warning'>
              <Icon icon='alarm' />
            </span>
          </Tooltip>
        )}
      </div>
    ),
    name: _('sr'),
    sortCriteria: 'name_label',
  },
  {
    itemRenderer: (srId, { vdisHealthBySr }) => (
      <div>
        {map(vdisHealthBySr[srId].unhealthyVdis, (unhealthyVdiLength, vdiId) => (
          <SingleLineRow key={vdiId}>
            <Col>
              <Vdi id={vdiId} />
            </Col>
            <Col>
              <span>{_('length', { length: unhealthyVdiLength })}</span>
            </Col>
          </SingleLineRow>
        ))}
      </div>
    ),
    name: _('vdisToCoalesce'),
  },
  {
    itemRenderer: (srId, { vdisHealthBySr }) => (
      <div>
        {Object.keys(vdisHealthBySr[srId].vdisWithUnknownVhdParent).map(vdiId => (
          <Vdi id={vdiId} key={vdiId} />
        ))}
      </div>
    ),
    name: _('vdisWithInvalidVhdParent'),
  },
]

const UnhealthyVdis = decorate([
  connectStore({
    srs: createGetObjectsOfType('SR'),
  }),
  addSubscriptions({
    vdisHealthBySr: subscribeSrsUnhealthyVdiChainsLength,
  }),
  provideState({
    computed: {
      srIds: (_, { srs, vdisHealthBySr = {} }) => {
        const srIds = []
        forEach(vdisHealthBySr, ({ unhealthyVdis, vdisWithUnknownVhdParent }, srId) => {
          if ((srs[srId] !== undefined && !isEmpty(unhealthyVdis)) || vdisWithUnknownVhdParent.length > 0) {
            srIds.push(srId)
          }
        })
        return srIds
      },
    },
  }),
  injectState,
  ({ state: { srIds }, vdisHealthBySr }) => (
    <Row>
      <Col>
        <Card>
          <CardHeader>
            <Icon icon='disk' /> {_('unhealthyVdis')}
          </CardHeader>
          <CardBlock>
            <Row>
              <Col>
                <SortedTable
                  data-vdisHealthBySr={vdisHealthBySr}
                  collection={srIds}
                  columns={COLUMNS}
                  stateUrlParam='s_unhealthy_vdis'
                />
              </Col>
            </Row>
          </CardBlock>
        </Card>
      </Col>
    </Row>
  ),
])

export default UnhealthyVdis
