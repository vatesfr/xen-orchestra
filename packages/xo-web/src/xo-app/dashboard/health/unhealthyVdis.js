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
import { forEach, isEmpty, map, size } from 'lodash'
import { Sr, Vdi } from 'render-xo-item'
import { subscribeSrsUnhealthyVdiChainsLength, VDIS_TO_COALESCE_LIMIT } from 'xo'

const COLUMNS = [
  {
    itemRenderer: (srId, { chainsLengthBySr }) => (
      <div>
        <Sr id={srId} link />{' '}
        {size(chainsLengthBySr[srId].unhealthyVdis) >= VDIS_TO_COALESCE_LIMIT && (
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
    itemRenderer: (srId, { chainsLengthBySr }) => (
      <div>
        {map(chainsLengthBySr[srId].unhealthyVdis, (chainLength, vdiId) => (
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
  {
    itemRenderer: (srId, { chainsLengthBySr }) => (
      <div>
        {map(chainsLengthBySr[srId].vdisWithUnknownVhdParent, vdiId => (
          <Vdi id={vdiId} />
        ))}
      </div>
    ),
    name: _('vdisWithInvalidVhdParent'),
  },
]

const UnhealthyVdis = decorate([
  addSubscriptions({
    chainsLengthBySr: subscribeSrsUnhealthyVdiChainsLength,
  }),
  provideState({
    computed: {
      srIds: (_, { chainsLengthBySr = {} }) => {
        const srIds = []
        forEach(chainsLengthBySr, (chainLength, srId) => {
          if (!isEmpty(chainLength.unhealthyVdis || chainLength.vdisWithUnknownVhdParent.length > 0)) {
            srIds.push(srId)
          }
        })
        return srIds
      },
    },
  }),
  injectState,
  ({ state: { srIds }, chainsLengthBySr }) => (
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
                  data-chainsLengthBySr={chainsLengthBySr}
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
