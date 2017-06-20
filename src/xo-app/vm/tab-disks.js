import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import DragNDropOrder from 'drag-n-drop-order'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import IsoDevice from 'iso-device'
import Link from 'link'
import map from 'lodash/map'
import propTypes from 'prop-types-decorator'
import React from 'react'
import SingleLineRow from 'single-line-row'
import some from 'lodash/some'
import StateButton from 'state-button'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { Container, Row, Col } from 'grid'
import { createSelector } from 'selectors'
import { injectIntl } from 'react-intl'
import { noop } from 'utils'
import { SelectSr, SelectVdi } from 'select-objects'
import { SizeInput, Toggle } from 'form'
import { XoSelect, Size, Text } from 'editable'
import { confirm } from 'modal'
import { error } from 'notification'
import {
  attachDiskToVm,
  createDisk,
  connectVbd,
  deleteVbd,
  deleteVdi,
  disconnectVbd,
  editVdi,
  isSrWritable,
  isVmRunning,
  migrateVdi,
  setBootableVbd,
  setVmBootOrder
} from 'xo'

@injectIntl
@propTypes({
  onClose: propTypes.func,
  vm: propTypes.object.isRequired
})
class NewDisk extends Component {
  constructor (props) {
    super(props)
    this.state = {
      sr: undefined
    }
  }

  _createDisk = () => {
    const { vm, onClose = noop } = this.props
    const {name, size, bootable, readOnly} = this.refs
    const { sr } = this.state
    return createDisk(name.value, size.value, sr)
      .then(diskId => {
        const mode = readOnly.value ? 'RO' : 'RW'
        return attachDiskToVm(diskId, vm, {
          bootable: bootable && bootable.value,
          mode
        })
          .then(onClose)
      })
  }

  _selectSr = sr => this.setState({sr})

  // FIXME: duplicate code
  _getSrPredicate = createSelector(
    () => {
      const { vm } = this.props
      return vm && vm.$pool
    },
    poolId => sr => sr.$pool === poolId && isSrWritable(sr)
  )

  render () {
    const { vm } = this.props
    const { formatMessage } = this.props.intl

    return <form id='newDiskForm'>
      <div className='form-group'>
        <SelectSr predicate={this._getSrPredicate()} onChange={this._selectSr} required />
      </div>
      <fieldset className='form-inline'>
        <div className='form-group'>
          <input type='text' ref='name' placeholder={formatMessage(messages.vbdNamePlaceHolder)} className='form-control' required />
        </div>
        {' '}
        <div className='form-group'>
          <SizeInput ref='size' placeholder={formatMessage(messages.vbdSizePlaceHolder)} required />
        </div>
        {' '}
        <div className='form-group'>
          {vm.virtualizationMode === 'pv' && <span>{_('vbdBootable')} <Toggle ref='bootable' /> </span>}
          <span>{_('vbdReadonly')} <Toggle ref='readOnly' /></span>
        </div>
        <span className='pull-right'>
          <ActionButton form='newDiskForm' icon='add' btnStyle='primary' handler={this._createDisk}>{_('vbdCreate')}</ActionButton>
        </span>
      </fieldset>
    </form>
  }
}

@propTypes({
  onClose: propTypes.func,
  vbds: propTypes.array.isRequired,
  vm: propTypes.object.isRequired
})
class AttachDisk extends Component {
  _getVdiPredicate = createSelector(
    () => {
      const { vm } = this.props
      return vm && vm.$pool
    },
    poolId => vdi => vdi.$pool === poolId
  )

  // FIXME: duplicate code
  _getSrPredicate = createSelector(
    () => {
      const { vm } = this.props
      return vm && vm.$pool
    },
    poolId => sr => sr.$pool === poolId && isSrWritable(sr)
  )

  _selectVdi = vdi => this.setState({vdi})

  _addVdi = () => {
    const { vm, vbds, onClose = noop } = this.props
    const { vdi } = this.state
    const { bootable, readOnly } = this.refs
    const _isFreeForWriting = vdi => vdi.$VBDs.length === 0 || some(vdi.$VBDs, id => {
      const vbd = vbds[id]
      return !vbd || !vbd.attached || vbd.read_only
    })
    const mode = readOnly.value || !_isFreeForWriting(vdi) ? 'RO' : 'RW'
    return attachDiskToVm(vdi, vm, {
      bootable: bootable && bootable.value,
      mode
    })
      .then(onClose)
  }

  render () {
    const { vm } = this.props
    const { vdi } = this.state

    return <form id='attachDiskForm'>
      <div className='form-group'>
        <SelectVdi
          predicate={this._getVdiPredicate()}
          srPredicate={this._getSrPredicate()}
          onChange={this._selectVdi}
        />
      </div>
      {vdi && <fieldset className='form-inline'>
        <div className='form-group'>
          {vm.virtualizationMode === 'pv' && <span>{_('vbdBootable')} <Toggle ref='bootable' /> </span>}
          <span>{_('vbdReadonly')} <Toggle ref='readOnly' /></span>
        </div>
        <span className='pull-right'>
          <ActionButton icon='add' form='attachDiskForm' btnStyle='primary' handler={this._addVdi}>{_('vbdCreate')}</ActionButton>
        </span>
      </fieldset>
      }
    </form>
  }
}

class MigrateVdiModalBody extends Component {
  get value () {
    return this.state
  }

  render () {
    return <Container>
      <SingleLineRow>
        <Col size={6}>
          {_('vdiMigrateSelectSr')}
        </Col>
        <Col size={6}>
          <SelectSr
            onChange={this.linkState('sr')}
            required
          />
        </Col>
      </SingleLineRow>
      <SingleLineRow className='mt-1'>
        <Col>
          <label>
            <input type='checkbox' onChange={this.linkState('migrateAll')} />
            {' '}
            {_('vdiMigrateAll')}
          </label>
        </Col>
      </SingleLineRow>
    </Container>
  }
}

export default class TabDisks extends Component {
  constructor (props) {
    super(props)
    this.state = {
      attachDisk: false,
      bootOrder: false,
      newDisk: false
    }
  }

  parseBootOrder = bootOrder => {
    // FIXME missing translation
    const bootOptions = {
      c: 'Hard-Drive',
      d: 'DVD-Drive',
      n: 'Network'
    }
    const order = []
    if (bootOrder) {
      for (const id of bootOrder) {
        if (id in bootOptions) {
          order.push({id, text: bootOptions[id], active: true})
          delete bootOptions[id]
        }
      }
    }
    forEach(bootOptions, (text, id) => { order.push({id, text, active: false}) })
    return {order}
  }

  setVmBootOrder = (_, newOrder) => {
    const { vm } = this.props
    let order = ''
    forEach(newOrder, item => { item.active && (order += item.id) })
    return setVmBootOrder(vm, order)
      .then(noop)
  }

  _toggleNewDisk = () => this.setState({
    newDisk: !this.state.newDisk,
    attachDisk: false,
    bootOrder: false
  })

  _toggleAttachDisk = () => this.setState({
    attachDisk: !this.state.attachDisk,
    bootOrder: false,
    newDisk: false
  })

  _toggleBootOrder = () => this.setState({
    bootOrder: !this.state.bootOrder,
    attachDisk: false,
    newDisk: false
  })

  _migrateVdi = vdi => {
    return confirm({
      title: _('vdiMigrate'),
      body: <MigrateVdiModalBody />
    }).then(({ sr, migrateAll }) => {
      if (!sr) {
        return error(_('vdiMigrateNoSr'), _('vdiMigrateNoSrMessage'))
      }
      return migrateAll
        ? Promise.all(map(this.props.vdis, vdi => migrateVdi(vdi, sr)))
        : migrateVdi(vdi, sr)
    })
  }

  render () {
    const {
      srs,
      vbds,
      vdis,
      vm
    } = this.props

    const {
      attachDisk,
      bootOrder,
      newDisk
    } = this.state

    return <Container>
      <Row>
        <Col className='text-xs-right'>
          <TabButton
            btnStyle={newDisk ? 'info' : 'primary'}
            handler={this._toggleNewDisk}
            icon='add'
            labelId='vbdCreateDeviceButton'
          />
          <TabButton
            btnStyle={attachDisk ? 'info' : 'primary'}
            handler={this._toggleAttachDisk}
            icon='disk'
            labelId='vdiAttachDeviceButton'
          />
          {vm.virtualizationMode !== 'pv' && <TabButton
            btnStyle={bootOrder ? 'info' : 'primary'}
            handler={this._toggleBootOrder}
            icon='sort'
            labelId='vdiBootOrder'
          />}
        </Col>
      </Row>
      <Row>
        <Col>
          {newDisk && <div><NewDisk vm={vm} onClose={this._toggleNewDisk} /><hr /></div>}
          {attachDisk && <div><AttachDisk vm={vm} vbds={vbds} /><hr /></div>}
          {bootOrder && <div><DragNDropOrder parseOrderParam={vm.boot && vm.boot.order} parseOrder={this.parseBootOrder} setOrder={this.setVmBootOrder} toggleItems onClose={this._toggleBootOrder} /><hr /></div>}
        </Col>
      </Row>
      <Row>
        <Col>
          {!isEmpty(vbds)
            ? <table className='table'>
              <thead className='thead-default'>
                <tr>
                  <th>{_('vdiNameLabel')}</th>
                  <th>{_('vdiNameDescription')}</th>
                  <th>{_('vdiSize')}</th>
                  <th>{_('vdiSr')}</th>
                  {vm.virtualizationMode === 'pv' && <th>{_('vbdBootableStatus')}</th>}
                  <th>{_('vbdStatus')}</th>
                  <th className='text-xs-right'>{_('vbdAction')}</th>
                </tr>
              </thead>
              <tbody>
                {map(vbds, vbd => {
                  const vdi = vdis[vbd.VDI]
                  if (vbd.is_cd_drive || !vdi) {
                    return
                  }

                  const sr = srs[vdi.$SR]

                  return <tr key={vbd.id}>
                    <td>
                      <Text value={vdi.name_label} onChange={value => editVdi(vdi, { name_label: value })} />
                    </td>
                    <td>
                      <Text value={vdi.name_description} onChange={value => editVdi(vdi, { name_description: value })} />
                    </td>
                    <td><Size value={vdi.size || null} onChange={size => editVdi(vdi, { size })} /></td>
                    <td> {sr &&
                      <XoSelect
                        onChange={sr => migrateVdi(vdi, sr)}
                        xoType='SR'
                        predicate={sr => sr.$pool === vm.$pool && isSrWritable(sr)}
                        labelProp='name_label'
                        value={sr}
                        useLongClick
                      >
                        <Link to={`/srs/${sr.id}`}>{sr.name_label}</Link>
                      </XoSelect>
                    }
                    </td>
                    {vm.virtualizationMode === 'pv' && <td>
                      <Toggle
                        value={vbd.bootable}
                        onChange={bootable => setBootableVbd(vbd, bootable)}
                      />
                    </td>}
                    <td>
                      <StateButton
                        disabledLabel={_('vbdStatusDisconnected')}
                        disabledHandler={connectVbd}
                        disabledTooltip={_('vbdConnect')}

                        enabledLabel={_('vbdStatusConnected')}
                        enabledHandler={disconnectVbd}
                        enabledTooltip={_('vbdDisconnect')}

                        disabled={!(vbd.attached || isVmRunning(vm))}
                        handlerParam={vbd}
                        state={vbd.attached}
                      />
                    </td>
                    <td className='text-xs-right'>
                      <Tooltip content={_('vdiMigrate')}>
                        <ActionRowButton
                          icon='vdi-migrate'
                          handler={this._migrateVdi}
                          handlerParam={vdi}
                        />
                      </Tooltip>
                      {!vbd.attached &&
                        <span>
                          <Tooltip content={_('vdiForget')}>
                            <ActionRowButton
                              icon='vdi-forget'
                              handler={deleteVbd}
                              handlerParam={vbd}
                            />
                          </Tooltip>
                          <Tooltip content={_('vdiRemove')}>
                            <ActionRowButton
                              icon='vdi-remove'
                              handler={deleteVdi}
                              handlerParam={vdi}
                            />
                          </Tooltip>
                        </span>
                      }
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
            : <h4 className='text-xs-center'>{_('vbdNoVbd')}</h4>
          }
        </Col>
      </Row>
      <Row>
        <Col mediumSize={5}>
          <IsoDevice vm={vm} />
        </Col>
      </Row>
    </Container>
  }
}
