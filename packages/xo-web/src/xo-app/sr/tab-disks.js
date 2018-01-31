import _ from 'intl'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import renderXoItem, { renderXoUnknownItem } from 'render-xo-item'
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
      const getVMsId = createSelector(getVbds, vbds => map(vbds, vbd => vbd.VM))
      const getVMs = createGetObjectsOfType('VM').pick(getVMsId)

      return (state, props) => ({
        vms: getVMs(state, props),
        vbds: getVbds(state, props),
        vdi: props.item,
      })
    })(({ vdi, vbds, vms }) => {
      if (vms === null) {
        return null // no attached VM
      }

      if (vms === undefined) {
        return renderXoUnknownItem()
      }

      return (
        <Container>
          {map(vms, vm => {
            if (vm === null) {
              return null // no attached VM
            }

            if (vm === undefined) {
              return renderXoUnknownItem()
            }
            let link
            const { type } = vm
            if (type === 'VM') {
              link = `/vms/${vm.id}`
            } else if (type === 'VM-snapshot') {
              const id = vm.$snapshot_of
              link =
                id !== undefined ? `/vms/${id}/snapshots` : '/dashboard/health'
            }

            const item = renderXoItem(vm)
            const vbd = find(vbds, { VDI: vdi.id, VM: vm.id })

            return (
              <Row>
                <Col mediumSize={8}>
                  {link === undefined ? item : <Link to={link}>{item}</Link>}{' '}
                </Col>
                <Col mediumSize={2}>
                  <ActionRowButton
                    btnStyle='danger'
                    disabled={!(vbd !== undefined && vbd.attached)}
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
