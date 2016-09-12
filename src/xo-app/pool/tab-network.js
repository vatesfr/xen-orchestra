import _ from 'intl'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import some from 'lodash/some'
import SortedTable from 'sorted-table'
import store from 'store'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { Button, ButtonGroup } from 'react-bootstrap-4/lib'
import { Text } from 'editable'
import { Container, Row, Col } from 'grid'
import { connectStore } from 'utils'
import { createGetObject, createGetObjectsOfType, createSelector } from 'selectors'
import { Toggle } from 'form'
import {
  connectPif,
  createNetwork,
  deleteNetwork,
  disconnectPif,
  editNetwork
} from 'xo'

const getObject = createGetObject((_, id) => id)

const disableUnplug = pif =>
  pif.attached && (pif.management || pif.disallowUnplug)

const _conditionalTooltip = (component, tooltip) => tooltip
  ? <Tooltip content={tooltip}>
    {component}
  </Tooltip>
  : component

const _disableNetworkDelete = network => {
  const state = store.getState()
  return some(network.PIFs, pif => disableUnplug(getObject(state, pif))) || network.name_label === 'Host internal management network'
}

@connectStore(() => {
  const pif = createGetObject()
  const host = createGetObject(
    createSelector(
      pif,
      pif => pif.$host
    )
  )

  return { host, pif }
})
class PifItem extends Component {
  render () {
    const { pif, host } = this.props
    return <tr>
      <td>{pif.device}</td>
      <td>{host.name_label}</td>
      <td>{pif.vlan}</td>
      <td>{pif.ip}</td>
      <td>{pif.mac}</td>
      <td>
        {pif.attached
          ? <span className='tag tag-success'>
            {_('poolNetworkPifAttached')}
          </span>
          : <span className='tag tag-default'>
            {_('poolNetworkPifDetached')}
          </span>
          }
      </td>
      <td>
        <ButtonGroup className='pull-xs-right'>
          <ActionRowButton
            btnStyle='default'
            disabled={disableUnplug(pif)}
            icon={pif.attached ? 'disconnect' : 'connect'}
            handler={pif.attached ? disconnectPif : connectPif}
            handlerParam={pif}
          />
        </ButtonGroup>
      </td>
    </tr>
  }
}

class PifsItem extends BaseComponent {
  render () {
    const { network } = this.props
    const { showPifs } = this.state

    return <div>
      <Tooltip content={showPifs ? _('hidePifs') : _('showPifs')}>
        <Button bsSize='small' bsStyle='secondary' className='m-b-1 pull-xs-right' onClick={this.toggleState('showPifs')}>
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

const NETWORKS_COLUMNS = [
  {
    name: _('poolNetworkNameLabel'),
    itemRenderer: network => <Text value={network.name_label} onChange={value => editNetwork(network, { name_label: value })} />,
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
    itemRenderer: (network, vifsByNetwork) => {
      const networkInUse = some(vifsByNetwork[network.id], vif => vif.attached)
      return _conditionalTooltip(
        <Toggle
          disabled={networkInUse}
          onChange={() => editNetwork(network, { defaultIsLocked: !network.defaultIsLocked })}
          value={network.defaultIsLocked}
        />,
        networkInUse && _('networkInUse')
      )
    }
  },
  {
    name: _('poolNetworkPif'),
    itemRenderer: network => !isEmpty(network.PIFs) && <PifsItem network={network} />,
    sortCriteria: network => network.PIFs.length
  },
  {
    name: '',
    itemRenderer: network => <ButtonGroup className='pull-xs-right'>
      <ActionRowButton
        btnStyle='default'
        disabled={_disableNetworkDelete(network)}
        handler={deleteNetwork}
        handlerParam={network}
        icon='delete'
      />
    </ButtonGroup>
  }
]

@connectStore(() => ({
  vifsByNetwork: createGetObjectsOfType('VIF').groupBy('$network')
}))
export default class TabNetworks extends Component {
  render () {
    const { networks, vifsByNetwork } = this.props

    return <Container>
      <Row>
        <Col className='text-xs-right'>
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
            ? <SortedTable collection={networks} columns={NETWORKS_COLUMNS} userData={vifsByNetwork} />
            : <h4 className='text-xs-center'>{_('poolNoNetwork')}</h4>
          }
        </Col>
      </Row>
    </Container>
  }
}
