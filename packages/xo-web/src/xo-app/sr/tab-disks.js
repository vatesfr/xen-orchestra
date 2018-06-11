import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import ButtonGroup from 'button-group'
import Component from 'base-component'
import copy from 'copy-to-clipboard'
import Icon from 'icon'
import Link from 'link'
import propTypes from 'prop-types-decorator'
import React from 'react'
import renderXoItem from 'render-xo-item'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import { injectIntl } from 'react-intl'
import { Text } from 'editable'
import { SizeInput, Toggle } from 'form'
import { Container, Row, Col } from 'grid'
import { connectStore, formatSize, noop } from 'utils'
import { concat, isEmpty, map, some } from 'lodash'
import {
  createGetObjectsOfType,
  createSelector,
  getCheckPermissions,
} from 'selectors'
import {
  connectVbd,
  createDisk,
  deleteVbd,
  deleteVdi,
  deleteVdis,
  disconnectVbd,
  editVdi,
  isVmRunning,
} from 'xo'

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
    name: _('vdiVms'),
    component: connectStore(() => {
      const getVbds = createGetObjectsOfType('VBD')
        .pick((_, props) => props.item.$VBDs)
        .sort()
      const getVmIds = createSelector(getVbds, vbds => map(vbds, 'VM'))
      const getVms = createGetObjectsOfType('VM').pick(getVmIds)
      const getVmControllers = createGetObjectsOfType('VM-controller').pick(
        getVmIds
      )
      const getVmSnapshots = createGetObjectsOfType('VM-snapshot').pick(
        getVmIds
      )
      const getVmTemplates = createGetObjectsOfType('VM-template').pick(
        getVmIds
      )
      const getAllVms = createSelector(
        getVms,
        getVmControllers,
        getVmSnapshots,
        getVmTemplates,
        (vms, vmControllers, vmSnapshots, vmTemplates) => ({
          ...vms,
          ...vmControllers,
          ...vmSnapshots,
          ...vmTemplates,
        })
      )

      return (state, props) => ({
        vms: getAllVms(state, props),
        vbds: getVbds(state, props),
      })
    })(({ vbds, vms }) => {
      if (isEmpty(vms)) {
        return null
      }

      return (
        <Container>
          {map(vbds, (vbd, index) => {
            const vm = vms[vbd.VM]

            if (vm === undefined) {
              return null
            }

            const type = vm.type
            let link
            if (type === 'VM') {
              link = `/vms/${vm.id}`
            } else if (type === 'VM-template') {
              link = `/home?s=${vm.id}&t=VM-template`
            } else {
              link =
                vm.$snapshot_of === undefined
                  ? '/dashboard/health'
                  : `/vms/${vm.$snapshot_of}/snapshots`
            }

            return (
              <Row className={index > 0 && 'mt-1'}>
                <Col mediumSize={8}>
                  <Link to={link}>{renderXoItem(vm)}</Link>
                </Col>
                <Col mediumSize={4}>
                  <ButtonGroup>
                    {vbd.attached ? (
                      <ActionRowButton
                        btnStyle='danger'
                        handler={disconnectVbd}
                        handlerParam={vbd}
                        icon='disconnect'
                        tooltip={_('vbdDisconnect')}
                      />
                    ) : (
                      <ActionRowButton
                        btnStyle='primary'
                        disabled={some(vbds, 'attached') || !isVmRunning(vm)}
                        handler={connectVbd}
                        handlerParam={vbd}
                        icon='connect'
                        tooltip={_('vbdConnect')}
                      />
                    )}
                    <ActionRowButton
                      btnStyle='danger'
                      handler={deleteVbd}
                      handlerParam={vbd}
                      icon='vdi-forget'
                      tooltip={_('vdiForget')}
                    />
                  </ButtonGroup>
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
    handler: vdi => copy(vdi.uuid),
    icon: 'clipboard',
    label: vdi => _('copyUuid', { uuid: vdi.uuid }),
  },
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

@injectIntl
@propTypes({
  onClose: propTypes.func,
  sr: propTypes.object.isRequired,
})
class NewDisk extends Component {
  _createDisk = () => {
    const { sr, onClose = noop } = this.props
    const { name, readOnly, size } = this.state

    return createDisk(name, size, sr, {
      mode: readOnly ? 'RO' : 'RW',
    }).then(onClose)
  }

  render () {
    const { formatMessage } = this.props.intl
    const { name, readOnly, size } = this.state

    return (
      <form id='newDiskForm' className='form-inline'>
        <div className='form-group'>
          <input
            autoFocus
            className='form-control'
            onChange={this.linkState('name')}
            placeholder={formatMessage(messages.vbdNamePlaceHolder)}
            required
            type='text'
            value={name}
          />
        </div>
        <div className='form-group ml-1'>
          <SizeInput
            onChange={this.linkState('size')}
            placeholder={formatMessage(messages.vbdSizePlaceHolder)}
            required
            value={size}
          />
        </div>
        <div className='form-group ml-1'>
          <span>
            {_('vbdReadonly')}{' '}
            <Toggle onChange={this.toggleState('readOnly')} value={readOnly} />
          </span>
        </div>
        <ActionButton
          className='pull-right'
          btnStyle='primary'
          form='newDiskForm'
          handler={this._createDisk}
          icon='add'
        >
          {_('vbdCreate')}
        </ActionButton>
      </form>
    )
  }
}

@connectStore(() => ({
  checkPermissions: getCheckPermissions,
}))
export default class SrDisks extends Component {
  _closeNewDiskForm = () => this.setState({ newDisk: false })

  _getAllVdis = createSelector(
    () => this.props.vdis,
    () => this.props.vdiSnapshots,
    () => this.props.unmanagedVdis,
    concat
  )

  _getIsSrAdmin = createSelector(
    () => this.props.checkPermissions,
    () => this.props.sr.id,
    (check, id) => check(id, 'administrate')
  )

  render () {
    const vdis = this._getAllVdis()
    const { newDisk } = this.state

    return (
      <Container>
        {this._getIsSrAdmin() && [
          <Row>
            <Col className='text-xs-right'>
              <TabButton
                btnStyle={newDisk ? 'info' : 'primary'}
                handler={this.toggleState('newDisk')}
                icon='add'
                labelId='vbdCreateDeviceButton'
              />
            </Col>
          </Row>,
          newDisk && (
            <Row>
              <Col>
                <NewDisk sr={this.props.sr} onClose={this._closeNewDiskForm} />
                <hr />
              </Col>
            </Row>
          ),
        ]}
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
