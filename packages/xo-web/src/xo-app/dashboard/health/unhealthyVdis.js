import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { Card, CardHeader, CardBlock } from 'card'
import { Col, Row } from 'grid'
import { injectState, provideState } from 'reaclette'
import { map, size } from 'lodash'
import { Sr, Vdi } from 'render-xo-item'
import { subscribeSrsUnhealthyVdiChainsLength, VDIS_TO_COALESCE_LIMIT } from 'xo'

const COLUMNS = [
  {
    itemRenderer: (srId, { unhealthyVdiChainsLengthBySr }) => (
      <div>
        <Sr id={srId} link />{' '}
        {size(unhealthyVdiChainsLengthBySr[srId]) >= VDIS_TO_COALESCE_LIMIT && (
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
    itemRenderer: (srId, { unhealthyVdiChainsLengthBySr }) => (
      <div>
        {map(unhealthyVdiChainsLengthBySr[srId], (chainLength, vdiId) => (
          <SingleLineRow key={vdiId}>
            <Col>
              <Vdi id={vdiId} />
            </Col>
            <Col>
              <span>{_('length', { length: chainLength })}</span>
            </Col>
          </SingleLineRow>
        ))}
      </div>
    ),
    name: _('vdisToCoalesce'),
  },
]

const UnhealthyVdis = decorate([
  addSubscriptions({
    unhealthyVdiChainsLengthBySr: subscribeSrsUnhealthyVdiChainsLength,
  }),
  provideState({
    computed: {
      srIds: (state, { unhealthyVdiChainsLengthBySr = {} }) => Object.keys(unhealthyVdiChainsLengthBySr),
    },
  }),
  injectState,
  ({ state: { srIds }, unhealthyVdiChainsLengthBySr }) => (
    <Row>
      <Col>
        <Card>
          <CardHeader>
            <Icon icon='disk' /> {_('vdisToCoalesce')}
          </CardHeader>
          <CardBlock>
            <Row>
              <Col>
                <SortedTable
                  data-unhealthyVdiChainsLengthBySr={unhealthyVdiChainsLengthBySr}
                  collection={srIds}
                  columns={COLUMNS}
                  stateUrlParam='s_vdis_to_coalesce'
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
