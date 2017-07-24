import _ from 'intl'
import ActionRow from 'action-row-button'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import renderXoItem, { renderXoUnknownItem } from 'render-xo-item'
import SortedTable from 'sorted-table'
import { concat, isEmpty } from 'lodash'
import { connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObject, createSelector } from 'selectors'
import { deleteVdi, editVdi } from 'xo'
import { Text } from 'editable'

// ===================================================================

const COLUMNS = [
  {
    name: _('vdiNameLabel'),
    itemRenderer: vdi => (
      <span>
        <Text value={vdi.name_label} onChange={value => editVdi(vdi, { name_label: value })} />
        {' '}
        {vdi.type === 'VDI-snapshot' &&
          <span className='tag tag-info'>
            <Icon icon='vm-snapshot' />
          </span>
        }
      </span>
    ),
    sortCriteria: vdi => vdi.name_label
  },
  {
    name: _('vdiNameDescription'),
    itemRenderer: vdi => (
      <Text value={vdi.name_description} onChange={value => editVdi(vdi, { name_description: value })} />
    )
  },
  {
    name: _('vdiVm'),
    component: connectStore(() => {
      const getObject = createGetObject((_, id) => id)

      return {
        vm: (state, { item: { $VBDs: [ vbdId ] } }) => {
          if (vbdId === undefined) {
            return null
          }

          const vbd = getObject(state, vbdId)
          if (vbd != null) {
            return getObject(state, vbd.VM)
          }
        }
      }
    })(({ vm }) => {
      if (vm === null) {
        return null // no attached VM
      }

      if (vm === undefined) {
        return renderXoUnknownItem()
      }

      return <Link to={`/vms/${
        vm.type === 'VM-snapshot'
        ? `${vm.$snapshot_of}/snapshots`
        : vm.id
      }`}>
        {renderXoItem(vm)}
      </Link>
    })
  },
  {
    name: _('vdiTags'),
    itemRenderer: vdi => vdi.tags
  },
  {
    name: _('vdiSize'),
    itemRenderer: vdi => formatSize(vdi.size),
    sortCriteria: vdi => vdi.size
  },
  {
    name: _('vdiAction'),
    itemRenderer: vdi => (
      <ActionRow
        btnStyle='danger'
        handler={deleteVdi}
        handlerParam={vdi}
        icon='delete'
      />
    )
  }
]

const FILTERS = {
  filterOnlyManaged: 'type:!VDI-unmanaged',
  filterOnlyRegular: '!type:|(VDI-snapshot VDI-unmanaged)',
  filterOnlySnapshots: 'type:VDI-snapshot',
  filterOnlyOrphaned: 'type:!VDI-unmanaged $VBDs:!""',
  filterOnlyUnmanaged: 'type:VDI-unmanaged'
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
    return <Container>
      <Row>
        <Col>
          {!isEmpty(vdis)
            ? <SortedTable
              collection={vdis}
              columns={COLUMNS}
              defaultFilter='filterOnlyManaged'
              filters={FILTERS}
            />
            : <h4 className='text-xs-center'>{_('srNoVdis')}</h4>
          }
        </Col>
      </Row>
    </Container>
  }
}
