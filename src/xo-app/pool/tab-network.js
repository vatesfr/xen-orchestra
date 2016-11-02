import _ from 'intl'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import some from 'lodash/some'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { Button, ButtonGroup } from 'react-bootstrap-4/lib'
import { Text, Number } from 'editable'
import { Container, Row, Col } from 'grid'
import { connectStore } from 'utils'
import { createGetObject, createGetObjectsOfType, createSelector } from 'selectors'
import { Toggle } from 'form'
import {
  connectPif,
  createBondedNetwork,
  createNetwork,
  deleteNetwork,
  disconnectPif,
  editNetwork,
  editPif
} from 'xo'

const _conditionalTooltip = (component, tooltip) => tooltip
  ? <Tooltip content={tooltip}>
    {component}
  </Tooltip>
  : component

@connectStore(() => {
  const pif = createGetObject()
  const host = createGetObject(
    createSelector(
      pif,
      pif => pif.$host
    )
  )
  const disableUnplug = createSelector(
    pif,
    pif =>
      pif.attached && !pif.isBondMaster && (pif.management || pif.disallowUnplug)
  )

  return { host, pif, disableUnplug }
})
class PifItem extends Component {
  _editPif = vlan =>
    editPif(this.props.pif, { vlan })

  render () {
    const { pif, host, disableUnplug } = this.props

    return <tr>
      <td>{pif.device}</td>
      <td>{host.name_label}</td>
      <td>
        {pif.vlan === -1
          ? 'None'
          : <Number value={pif.vlan} onChange={this._editPif}>
            {pif.vlan}
          </Number>
        }
      </td>
      <td>{pif.ip}</td>
      <td>{pif.mac}</td>
      <td>
        {pif.carrier
          ? <span className='tag tag-success'>
            {_('poolNetworkPifAttached')}
          </span>
          : <span className='tag tag-default'>
            {_('poolNetworkPifDetached')}
          </span>
          }
      </td>
      <td>
        <ButtonGroup className='pull-right'>
          <ActionRowButton
            btnStyle='default'
            disabled={disableUnplug}
            handler={pif.attached ? disconnectPif : connectPif}
            handlerParam={pif}
            icon={pif.attached ? 'disconnect' : 'connect'}
            tooltip={pif.attached ? _('disconnectPif') : _('connectPif')}
          />
        </ButtonGroup>
      </td>
    </tr>
  }
}

@connectStore(() => ({
  isBonded: createSelector(
    createGetObjectsOfType('PIF').pick(
      (_, props) => props && props.network.PIFs
    ),
    pifs => some(pifs, 'isBondMaster')
  )
}))
class NetworkName extends Component {
  _editName = value => editNetwork(this.props.network, { name_label: value })

  render () {
    const { isBonded, network } = this.props
    return <span>
      <Text value={network.name_label} onChange={this._editName} />
      {' '}
      {isBonded && <span className='tag tag-pill tag-info'>{_('pillBonded')}</span>}
    </span>
  }
}

@connectStore(() => ({
  isInUse: createSelector(
    createGetObjectsOfType('VIF').pick(
      (_, props) => props && props.network.VIFs
    ),
    vifs => some(vifs, 'attached')
  )
}))
class ToggleDefaultLockingMode extends Component {
  _editDefaultIsLocked = () => {
    const { network } = this.props
    editNetwork(network, { defaultIsLocked: !network.defaultIsLocked })
  }

  render () {
    const { isInUse, network } = this.props
    return _conditionalTooltip(
      <Toggle
        disabled={isInUse}
        onChange={this._editDefaultIsLocked}
        value={network.defaultIsLocked}
      />,
      isInUse && _('networkInUse')
    )
  }
}

class PifsItem extends BaseComponent {
  render () {
    const { network } = this.props
    const { showPifs } = this.state

    return <div>
      <Tooltip content={showPifs ? _('hidePifs') : _('showPifs')}>
        <Button bsSize='small' bsStyle='secondary' className='mb-1 pull-right' onClick={this.toggleState('showPifs')}>
          <Icon icon={showPifs ? 'hidden' : 'shown'} />
        </Button>
      </Tooltip>
      {showPifs && <table className='table'>
        <thead className='thead-default'>
          <tr>
            <th>{_('pifDeviceLabel')}</th>
            <th>{_('homeTypeHost')}</th>
            <th>{_('pifVlanLabel')}</th>
            <th>{_('pifAddressLabel')}</th>
            <th>{_('pifMacLabel')}</th>
            <th>{_('pifStatusLabel')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {map(network.PIFs, pifId => <PifItem key={pifId} id={pifId} />)}
        </tbody>
      </table>}
    </div>
  }
}

@connectStore(() => {
  const getPifs = createGetObjectsOfType('PIF').pick(
    (_, props) => props && props.network.PIFs
  )

  const disablePifUnplug = pif =>
      pif.attached && !pif.isBondMaster && (pif.management || pif.disallowUnplug)

  const getDisableNetworkDelete = createSelector(
    getPifs,
    (_, props) => props && props.network.name_label,
    (pifs, nameLabel) =>
      nameLabel === 'Host internal management network' || some(pifs, disablePifUnplug)
  )

  return {
    disableNetworkDelete: getDisableNetworkDelete
  }
})
class NetworkActions extends Component {
  render () {
    const { network, disableNetworkDelete } = this.props

    return <ButtonGroup className='pull-right'>
      <ActionRowButton
        btnStyle='default'
        disabled={disableNetworkDelete}
        handler={deleteNetwork}
        handlerParam={network}
        icon='delete'
        tooltip={_('deleteNetwork')}
      />
    </ButtonGroup>
  }
}

const NETWORKS_COLUMNS = [
  {
    name: _('poolNetworkNameLabel'),
    itemRenderer: network => <NetworkName network={network} />,
    sortCriteria: network => network.name_label
  },
  {
    name: _('poolNetworkDescription'),
    itemRenderer: network => <Text value={network.name_description} onChange={value => editNetwork(network, { name_description: value })} />,
    sortCriteria: network => network.name_description
  },
  {
    name: _('poolNetworkMTU'),
    itemRenderer: network => network.MTU
  },
  {
    name: <div className='text-xs-center'>
      <Tooltip content={_('defaultLockingMode')}>
        <Icon size='lg' icon='lock' />
      </Tooltip>
    </div>,
    itemRenderer: network => <ToggleDefaultLockingMode network={network} />
  },
  {
    name: _('poolNetworkPif'),
    itemRenderer: network => !isEmpty(network.PIFs) && <PifsItem network={network} />,
    sortCriteria: network => network.PIFs.length
  },
  {
    name: '',
    itemRenderer: network => <NetworkActions network={network} />
  }
]

export default class TabNetworks extends Component {
  render () {
    const { networks } = this.props

    return <Container>
      <Row>
        <Col className='text-xs-right'>
          <TabButton
            btnStyle='primary'
            handler={createBondedNetwork}
            handlerParam={this.props.pool}
            icon='add'
            labelId='networkCreateBondedButton'
          />
          <TabButton
            btnStyle='primary'
            handler={createNetwork}
            handlerParam={this.props.pool}
            icon='add'
            labelId='networkCreateButton'
          />
        </Col>
      </Row>
      <Row>
        <Col>
          {!isEmpty(networks)
            ? <SortedTable collection={networks} columns={NETWORKS_COLUMNS} />
            : <h4 className='text-xs-center'>{_('poolNoNetwork')}</h4>
          }
        </Col>
      </Row>
    </Container>
  }
}
