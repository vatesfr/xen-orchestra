import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { Card, CardHeader, CardBlock } from 'card'
import { Col, Row } from 'grid'
import { getUnhealthyVdiChainsLength } from 'xo'
import { injectState, provideState } from 'reaclette'
import { map, size } from 'lodash'
import { Sr, Vdi } from 'render-xo-item'

const VDIS_TO_COALESCE_LIMIT = 10

const UNHEALTHY_VDI_CHAINS = [
  {
    itemRenderer: (srId, { unhealthyVdiChainsLengthBySr }) => (
      <div>
        {size(unhealthyVdiChainsLengthBySr[srId]) >= VDIS_TO_COALESCE_LIMIT && (
          <Tooltip content={_('srVdisToCoalesceWarning', { limitVdis: VDIS_TO_COALESCE_LIMIT })}>
            <span className='text-warning'>
              <Icon icon='alarm' />{' '}
            </span>
          </Tooltip>
        )}
        <Sr id={srId} link />
      </div>
    ),
    name: _('sr'),
    sortCriteria: 'name_label',
  },
  {
    itemRenderer: (srId, { unhealthyVdiChainsLengthBySr }) => (
      <div>
        {map(unhealthyVdiChainsLengthBySr[srId], (chainLength, vdiId) => (
          <Row key={vdiId}>
            <Col>
              <Vdi id={vdiId} />
            </Col>
            <Col>
              <span>{_('length', { length: chainLength })}</span>
            </Col>
          </Row>
        ))}
      </div>
    ),
    name: _('vdisToCoalesce'),
  },
]

const VdisToCoalesce = decorate([
  provideState({
    initialize({ fetchUnhealthyVdiChainsLength }) {
      return fetchUnhealthyVdiChainsLength(this.props.srs.map(({ id }) => id))
    },
    effects: {
      initialState: () => ({
        unhealthyVdiChainsLengthBySr: {},
      }),
      async fetchUnhealthyVdiChainsLength(effects, srs) {
        const unhealthyVdiChainsLengthBySr = { ...this.state.unhealthyVdiChainsLengthBySr }
        await Promise.all(
          srs.map(async srId => {
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
      srIds: ({ unhealthyVdiChainsLengthBySr }) => Object.keys(unhealthyVdiChainsLengthBySr),
    },
  }),
  injectState,
  ({ state: { srIds, unhealthyVdiChainsLengthBySr } }) => (
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
                  columns={UNHEALTHY_VDI_CHAINS}
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
