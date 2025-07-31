import _ from 'intl'
import decorate from 'apply-decorators'
import Copiable from 'copiable'
import defined from '@xen-orchestra/defined'
import React from 'react'
import { injectState, provideState } from 'reaclette'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import { addSubscriptions, connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { CustomFields } from 'custom-fields'
import { createGetObjectsOfType } from 'selectors'
import { createSelector } from 'reselect'
import {
  createSrUnhealthyVdiChainsLengthSubscription,
  deleteSr,
  reclaimSrSpace,
  toggleSrMaintenanceMode,
  getSmFromSr,
} from 'xo'
import { flowRight, isEmpty, keys } from 'lodash'

// ===================================================================

const COLUMNS = [
  {
    itemRenderer: _ => <span>{_.name_label}</span>,
    name: _('srUnhealthyVdiNameLabel'),
    sortCriteria: 'name_label',
  },
  {
    itemRenderer: vdi => formatSize(vdi.size),
    name: _('srUnhealthyVdiSize'),
    sortCriteria: 'size',
  },
  {
    itemRenderer: (vdi, chains) => chains[vdi.uuid],
    name: _('srUnhealthyVdiDepth'),
    sortCriteria: (vdi, chains) => chains[vdi.uuid],
  },
  {
    itemRenderer: _ => <Copiable tagName='div'>{_.uuid}</Copiable>,
    name: _('srUnhealthyVdiUuid'),
    sortCriteria: 'uuid',
  },
]

const UnhealthyVdiChains = flowRight(
  addSubscriptions(props => ({
    chains: createSrUnhealthyVdiChainsLengthSubscription(props.sr),
  })),
  connectStore(() => ({
    vdis: createGetObjectsOfType('VDI').pick(createSelector((_, props) => props.chains?.unhealthyVdis, keys)),
  }))
)(({ chains: { nUnhealthyVdis, unhealthyVdis } = {}, vdis }) =>
  isEmpty(vdis) ? null : (
    <div>
      <hr />
      <h3>{_('srUnhealthyVdiTitle', { total: nUnhealthyVdis })}</h3>
      <SortedTable collection={vdis} columns={COLUMNS} stateUrlParam='s_unhealthy_vdis' userData={unhealthyVdis} />
    </div>
  )
)

export default decorate([
  provideState({
    computed: {
      sm: (_, { sr }) => getSmFromSr(sr),
    },
  }),
  injectState,
  ({ sr, state: { sm } }) => (
    <Container>
      <Row>
        <Col className='text-xs-right'>
          <TabButton
            btnStyle='primary'
            handler={reclaimSrSpace}
            handlerParam={sr}
            icon='sr-reclaim-space'
            labelId='srReclaimSpace'
          />
          {sr.inMaintenanceMode ? (
            <TabButton
              btnStyle='warning'
              handler={toggleSrMaintenanceMode}
              handlerParam={sr}
              icon='sr-disable'
              labelId='disableMaintenanceMode'
            />
          ) : (
            <TabButton
              btnStyle='warning'
              handler={toggleSrMaintenanceMode}
              handlerParam={sr}
              icon='sr-enable'
              labelId='enableMaintenanceMode'
            />
          )}
          <TabButton btnStyle='danger' handler={deleteSr} handlerParam={sr} icon='sr-remove' labelId='srRemoveButton' />
        </Col>
      </Row>
      <Row>
        <Col>
          <table className='table'>
            <tbody>
              <tr>
                <th>{_('provisioning')}</th>
                <td>{defined(sr.allocationStrategy, _('unknown'))}</td>
              </tr>
              <tr>
                <th>{_('supportedImageFormats')}</th>
                <td>{defined(sm?.supported_image_formats?.toString().toUpperCase(), 'VHD')}</td>
              </tr>
              <tr>
                <th>{_('customFields')}</th>
                <td>
                  <CustomFields object={sr.id} />
                </td>
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
  ),
])
