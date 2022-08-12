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
]

const COLUMNS_VDI_UNKNOWN_PARENT = [
  {
    itemRenderer: srId => <Sr id={srId} link />,
    name: _('sr'),
    sortCriteria: 'name_label',
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
      srIdsWithUnhealthyVdis: (_, { chainsLengthBySr = {} }) => {
        const srIds = []
        forEach(chainsLengthBySr, (chainLength, srId) => {
          if (!isEmpty(chainLength.unhealthyVdis)) {
            srIds.push(srId)
          }
        })
        return srIds
      },
      srIdsWithUnknownVdisParent: (_, { chainsLengthBySr } = {}) => {
        const srIds = []
        forEach(chainsLengthBySr, (chainLength, srId) => {
          if (chainLength.vdisWithUnknownVhdParent.length > 0) {
            srIds.push(srId)
          }
        })
        return srIds
      },
    },
  }),
  injectState,
  ({ state: { srIdsWithUnknownVdisParent, srIdsWithUnhealthyVdis }, chainsLengthBySr }) => (
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
                  data-chainsLengthBySr={chainsLengthBySr}
                  collection={srIdsWithUnhealthyVdis}
                  columns={COLUMNS}
                  stateUrlParam='s_vdis_to_coalesce'
                />
              </Col>
            </Row>
          </CardBlock>
        </Card>
      </Col>

      <Col>
        <Card>
          <CardHeader>
            <Icon icon='disk' /> {_('vdisWithInvalidVhdParent')}
          </CardHeader>
          <CardBlock>
            <Row>
              <Col>
                <SortedTable
                  data-chainsLengthBySr={chainsLengthBySr}
                  collection={srIdsWithUnknownVdisParent}
                  columns={COLUMNS_VDI_UNKNOWN_PARENT}
                  stateUrlParam='s_vdis_invalid_parent'
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
