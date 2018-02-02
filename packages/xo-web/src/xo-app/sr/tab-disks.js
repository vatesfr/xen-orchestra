import _ from 'intl'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import renderXoItem from 'render-xo-item'
import SortedTable from 'sorted-table'
import { concat, find, isEmpty, map } from 'lodash'
import { connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { deleteVbd, deleteVdi, deleteVdis, editVdi } from 'xo'
import { Text } from 'editable'

// ===================================================================

const COLUMNS = [
  {
    name: _('vdiNameLabel'),
    itemRenderer: vdi => (
      <span>
        <Text
          value={vdi.name_label}
          onChange={value => editVdi(vdi, { name_label: value })}
        />{' '}
        {vdi.type === 'VDI-snapshot' && (
          <span className='tag tag-info'>
            <Icon icon='vm-snapshot' />
          </span>
        )}
      </span>
    ),
    sortCriteria: vdi => vdi.name_label,
  },
  {
    name: _('vdiNameDescription'),
    itemRenderer: vdi => (
      <Text
        value={vdi.name_description}
        onChange={value => editVdi(vdi, { name_description: value })}
      />
    ),
  },
  {
    name: _('vdiTags'),
    itemRenderer: vdi => vdi.tags,
  },
  {
    name: _('vdiSize'),
    itemRenderer: vdi => formatSize(vdi.size),
    sortCriteria: vdi => vdi.size,
  },
  {
    name: _('vdiVm'),
    component: connectStore(() => {
      const getVbds = createGetObjectsOfType('VBD').pick(
        (_, props) => props.item.$VBDs
      )
      const getVmIds = createSelector(getVbds, vbds => map(vbds, 'VM'))
      const getVms = createGetObjectsOfType('VM').pick(getVmIds)

      return (state, props) => ({
        vms: getVms(state, props),
        vbds: getVbds(state, props),
      })
    })(({ vbds, vms }) => {
      if (isEmpty(vms)) {
        return null
      }

      return (
        <Container>
          {map(vms, vm => {
            const vmId = vm.id
            const item = renderXoItem(vm)
            const vbd = find(vbds, { VM: vmId })

            return (
              <Row>
                <Col mediumSize={8}>
                  {<Link to={`/vms/${vmId}`}>{item}</Link>}{' '}
                </Col>
                <Col mediumSize={2}>
                  <ActionRowButton
                    btnStyle='danger'
                    disabled={!vbd.attached}
                    handler={deleteVbd}
                    handlerParam={vbd}
                    icon='vdi-forget'
                    tooltip={_('vdiForget')}
                  />
                </Col>
              </Row>
            )
          })}
        </Container>
      )
    }),
  },
]

const GROUPED_ACTIONS = [
  {
    handler: deleteVdis,
    icon: 'delete',
    label: _('deleteSelectedVdis'),
    level: 'danger',
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: deleteVdi,
    icon: 'delete',
    label: _('deleteSelectedVdi'),
    level: 'danger',
  },
]

const FILTERS = {
  filterOnlyManaged: 'type:!VDI-unmanaged',
  filterOnlyRegular: '!type:|(VDI-snapshot VDI-unmanaged)',
  filterOnlySnapshots: 'type:VDI-snapshot',
  filterOnlyOrphaned: 'type:!VDI-unmanaged $VBDs:!""',
  filterOnlyUnmanaged: 'type:VDI-unmanaged',
}

// ===================================================================

export default class SrDisks extends Component {
  _getAllVdis = createSelector(
    () => this.props.vdis,
    () => this.props.vdiSnapshots,
    () => this.props.unmanagedVdis,
    concat
  )

  render () {
    const vdis = this._getAllVdis()
    return (
      <Container>
        <Row>
          <Col>
            {!isEmpty(vdis) ? (
              <SortedTable
                collection={vdis}
                columns={COLUMNS}
                defaultFilter='filterOnlyManaged'
                filters={FILTERS}
                groupedActions={GROUPED_ACTIONS}
                individualActions={INDIVIDUAL_ACTIONS}
                shortcutsTarget='body'
                stateUrlParam='s'
              />
            ) : (
              <h4 className='text-xs-center'>{_('srNoVdis')}</h4>
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}
