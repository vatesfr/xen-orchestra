import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import ButtonGroup from 'button-group'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import propTypes from 'prop-types-decorator'
import React from 'react'
import renderXoItem from 'render-xo-item'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import { injectIntl } from 'react-intl'
import { Text } from 'editable'
import { SelectVm } from 'select-objects'
import { SizeInput, Toggle } from 'form'
import { Container, Row, Col } from 'grid'
import { concat, get, includes, isEmpty, map, some } from 'lodash'
import { createFinder, createGetObjectsOfType, createSelector } from 'selectors'
import {
  addSubscriptions,
  connectStore,
  formatSize,
  noop,
  resolveResourceSet,
} from 'utils'
import {
  connectVbd,
  createDisk,
  deleteVbd,
  deleteVdi,
  deleteVdis,
  disconnectVbd,
  editVdi,
  isVmRunning,
  subscribeResourceSets,
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
      const getVmSnapshots = createGetObjectsOfType('VM-snapshot').pick(
        getVmIds
      )
      const getAllVms = createSelector(
        getVms,
        getVmSnapshots,
        (vms, vmSnapshots) => ({ ...vms, ...vmSnapshots })
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

            const link =
              vm.type === 'VM'
                ? `/vms/${vm.id}`
                : vm.$snapshot_of === undefined
                  ? '/dashboard/health'
                  : `/vms/${vm.$snapshot_of}/snapshots`

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
@addSubscriptions({
  resourceSets: subscribeResourceSets,
})
class NewDisk extends Component {
  _createDisk = () => {
    const { sr, onClose = noop } = this.props
    const { bootable, name, readOnly, size, vm } = this.state

    return createDisk(name, size, sr, {
      vm,
      bootable,
      mode: readOnly ? 'RO' : 'RW',
    }).then(onClose)
  }

  _getResourceSet = createFinder(
    () => this.props.resourceSets,
    createSelector(
      () => this.state.vm && this.state.vm.resourceSet,
      id => resourceSet => resourceSet.id === id
    )
  )

  _getResolvedResourceSet = createSelector(
    this._getResourceSet,
    resolveResourceSet
  )

  _getIsInPool = createSelector(
    () => this.props.sr.$pool,
    poolId => ({ $pool }) => $pool === poolId
  )

  _getIsInResourceSet = createSelector(
    () => {
      const resourceSet = this._getResourceSet()
      return resourceSet && resourceSet.objects
    },
    objectsIds => id => includes(objectsIds, id)
  )

  _getVmPredicate = createSelector(
    this._getIsInPool,
    this._getIsInResourceSet,
    (isInPool, isInResourceSet) => vm =>
      vm.resourceSet !== undefined ? isInResourceSet(vm.id) : isInPool(vm)
  )

  _getResourceSetDiskLimit = createSelector(this._getResourceSet, resourceSet =>
    get(resourceSet, 'limits.disk.available')
  )

  render () {
    const { formatMessage } = this.props.intl
    const { bootable, name, readOnly, size, vm } = this.state

    const diskLimit = this._getResourceSetDiskLimit()
    const resourceSet = this._getResolvedResourceSet()

    return (
      <form id='newDiskForm'>
        <div className='form-group'>
          <SelectVm
            onChange={this.linkState('vm')}
            predicate={this._getVmPredicate()}
            required
            value={vm}
          />
        </div>
        <fieldset className='form-inline'>
          <div className='form-group'>
            <input
              className='form-control'
              onChange={this.linkState('name')}
              placeholder={formatMessage(messages.vbdNamePlaceHolder)}
              required
              type='text'
              value={name}
            />
          </div>{' '}
          <div className='form-group'>
            <SizeInput
              onChange={this.linkState('size')}
              placeholder={formatMessage(messages.vbdSizePlaceHolder)}
              required
              value={size}
            />
          </div>
          <div className='form-group'>
            {vm &&
              vm.virtualizationMode !== 'pv' && (
                <span>
                  {_('vbdBootable')}{' '}
                  <Toggle
                    onChange={this.toggleState('bootable')}
                    value={bootable}
                  />{' '}
                </span>
              )}

            <span>
              {_('vbdReadonly')}{' '}
              <Toggle
                onChange={this.toggleState('readOnly')}
                value={readOnly}
              />
            </span>
          </div>
          <span className='pull-right'>
            <ActionButton
              btnStyle='primary'
              disabled={diskLimit < size}
              form='newDiskForm'
              handler={this._createDisk}
              icon='add'
            >
              {_('vbdCreate')}
            </ActionButton>
          </span>
        </fieldset>
        {resourceSet !== undefined &&
          diskLimit !== undefined &&
          (diskLimit < size ? (
            <em className='text-danger'>
              {_('notEnoughSpaceInResourceSet', {
                resourceSet: <strong>{resourceSet.name}</strong>,
                spaceLeft: formatSize(diskLimit),
              })}
            </em>
          ) : (
            <em>
              {_('useQuotaWarning', {
                resourceSet: <strong>{resourceSet.name}</strong>,
                spaceLeft: formatSize(diskLimit),
              })}
            </em>
          ))}
      </form>
    )
  }
}

export default class SrDisks extends Component {
  constructor (props) {
    super(props)
    this.state = {
      newDisk: false,
    }
  }

  _toggleNewDisk = () =>
    this.setState({
      newDisk: !this.state.newDisk,
    })

  _getAllVdis = createSelector(
    () => this.props.vdis,
    () => this.props.vdiSnapshots,
    () => this.props.unmanagedVdis,
    concat
  )

  render () {
    const vdis = this._getAllVdis()
    const { newDisk } = this.state

    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            <TabButton
              btnStyle={newDisk ? 'info' : 'primary'}
              handler={this._toggleNewDisk}
              icon='add'
              labelId='vbdCreateDeviceButton'
            />
          </Col>
          <Col>
            {newDisk && (
              <div>
                <NewDisk sr={this.props.sr} onClose={this._toggleNewDisk} />
                <hr />
              </div>
            )}
          </Col>
        </Row>
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
