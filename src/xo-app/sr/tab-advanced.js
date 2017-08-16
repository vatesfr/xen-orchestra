import _ from 'intl'
import Copiable from 'copiable'
import React from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import { addSubscriptions, connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { createSelector } from 'reselect'
import { createSrUnhealthyVdiChainsLengthSubscription, deleteSr } from 'xo'
import { flowRight, isEmpty, keys, sum, values } from 'lodash'

// ===================================================================

const COLUMNS = [
  {
    name: _('srUnhealthyVdiNameLabel'),
    itemRenderer: vdi => <span>{vdi.name_label}</span>,
    sortCriteria: vdi => vdi.name_label
  },
  {
    name: _('srUnhealthyVdiSize'),
    itemRenderer: vdi => formatSize(vdi.size),
    sortCriteria: vdi => vdi.size
  },
  {
    name: _('srUnhealthyVdiDepth'),
    itemRenderer: (vdi, chains) => chains[vdi.uuid],
    sortCriteria: (vdi, chains) => chains[vdi.uuid]
  }
]

const UnhealthyVdiChains = flowRight(
  addSubscriptions(props => ({
    chains: createSrUnhealthyVdiChainsLengthSubscription(props.sr)
  })),
  connectStore(() => ({
    vdis: createGetObjectsOfType('VDI').pick(
      createSelector(
        (_, props) => props.chains,
        keys
      )
    )
  }))
)(({ chains, vdis }) => isEmpty(vdis)
  ? null
  : <div>
    <h3>{_('srUnhealthyVdiTitle', { total: sum(values(chains)) })}</h3>
    <SortedTable
      collection={vdis}
      columns={COLUMNS}
      userData={chains}
    />
  </div>
)

export default ({
  sr
}) => <Container>
  <Row>
    <Col className='text-xs-right'>
      <TabButton
        btnStyle='danger'
        handler={deleteSr}
        handlerParam={sr}
        icon='sr-remove'
        labelId='srRemoveButton'
      />
    </Col>
  </Row>
  <Row>
    <Col>
      <h3>{_('xenSettingsLabel')}</h3>
      <table className='table'>
        <tbody>
          <tr>
            <th>{_('uuid')}</th>
            <Copiable tagName='td'>
              {sr.uuid}
            </Copiable>
          </tr>
        </tbody>
      </table>
    </Col>
  </Row>
  <Row>
    <Col>
      <UnhealthyVdiChains sr={sr} />
    </Col>
  </Row>
</Container>
