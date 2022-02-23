import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { Card, CardHeader, CardBlock } from 'card'
import { Col, Row } from 'grid'
import { getUnhealthyVdiChainsLength } from 'xo'
import { injectState, provideState } from 'reaclette'
import { map, size } from 'lodash'
import { Sr, Vdi } from 'render-xo-item'

const VDIS_TO_COALESCE_LIMIT = 10

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

const VdisToCoalesce = decorate([
  provideState({
    initialState: () => ({
      unhealthyVdiChainsLengthBySr: {},
    }),
    effects: {
      initialize({ fetchUnhealthyVdiChainsLength }) {
        return fetchUnhealthyVdiChainsLength(map(this.props.srs, 'id'))
      },
      async fetchUnhealthyVdiChainsLength(effects, srIds) {
        const unhealthyVdiChainsLengthBySr = { ...this.state.unhealthyVdiChainsLengthBySr }
        await Promise.all(
          srIds.map(async srId => {
            const unhealthyVdiChainsLength = await getUnhealthyVdiChainsLength(srId)
            if (size(unhealthyVdiChainsLength) > 0) {
              unhealthyVdiChainsLengthBySr[srId] = unhealthyVdiChainsLength
            }
          })
        )

        this.state.unhealthyVdiChainsLengthBySr = unhealthyVdiChainsLengthBySr
      },
    },
    computed: {
      srIds: ({ unhealthyVdiChainsLengthBySr = {} }) => Object.keys(unhealthyVdiChainsLengthBySr),
    },
  }),
  injectState,
  ({ state: { srIds, unhealthyVdiChainsLengthBySr }, srs }) => (
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

export default VdisToCoalesce
