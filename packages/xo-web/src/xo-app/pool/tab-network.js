import _ from 'intl'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import ButtonGroup from 'button-group'
import copy from 'copy-to-clipboard'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import React, { Component } from 'react'
import some from 'lodash/some'
import SortedTable from 'sorted-table'
import PifsColumn from 'sorted-table/pifs-column'
import Tooltip, { conditionalTooltip } from 'tooltip'
import { connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
import { TabButtonLink } from 'tab-button'
import { Text, Number } from 'editable'
import { Select, Toggle } from 'form'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { deleteNetwork, editNetwork, editPif } from 'xo'

// =============================================================================

@connectStore(() => ({
  isBonded: createSelector(
    createGetObjectsOfType('PIF').pick((_, props) => props && props.network.PIFs),
    pifs => some(pifs, 'isBondMaster')
  ),
}))
class Name extends Component {
  _editName = value => editNetwork(this.props.network, { name_label: value })

  render() {
    const { isBonded, network } = this.props

    return (
      <span>
        <Text value={network.name_label} onChange={this._editName} />{' '}
        {isBonded && <span className='tag tag-pill tag-info'>{_('pillBonded')}</span>}
      </span>
    )
  }
}

// -----------------------------------------------------------------------------

class AutomaticNetwork extends Component {
  _editAutomaticNetwork = automatic => editNetwork(this.props.network, { automatic })

  render() {
    const { network } = this.props

    return <Toggle onChange={this._editAutomaticNetwork} value={network.automatic} />
  }
}

// -----------------------------------------------------------------------------

class Description extends Component {
  _editDescription = value => editNetwork(this.props.network, { name_description: value })

  render() {
    const { network } = this.props

    return <Text value={network.name_description} onChange={this._editDescription} />
  }
}

// -----------------------------------------------------------------------------

class Mtu extends Component {
  _editMtu = value => editNetwork(this.props.network, { mtu: value })

  render() {
    const { network } = this.props

    return <Number value={network.MTU} onChange={this._editMtu} />
  }
}

class DefaultPif extends BaseComponent {
  _editPif = vlan => editPif(this.props.network.defaultPif, { vlan })

  render() {
    const { defaultPif } = this.props.network

    if (!defaultPif) {
      return null
    }

    return <span>{defaultPif.device}</span>
  }
}

class Nbd extends Component {
  NBD_FILTER_OPTIONS = [
    {
      labelId: 'noNbdConnection',
      value: false,
    },
    {
      labelId: 'nbdConnection',
      value: true,
    },
  ]
  INSECURE_OPTION = [
    {
      labelId: 'insecureNbdConnection',
      value: 'insecure_nbd',
      disabled: true,
    },
  ]

  _getOptionRenderer = ({ labelId }) => _(labelId)

  _editNbdConnection = value => {
    editNetwork(this.props.network, { nbd: value.value })
  }

  render() {
    const { network } = this.props

    return (
      <Select
        onChange={this._editNbdConnection}
        optionRenderer={this._getOptionRenderer}
        // We chose not to show the unsecure_nbd option unless the user has already activated it through another client.
        // The reason is that we don't want them to know about it since the option is not allowed in XO.
        options={network.insecureNbd ? [...this.NBD_FILTER_OPTIONS, ...this.INSECURE_OPTION] : this.NBD_FILTER_OPTIONS}
        value={network.nbd ? true : network.insecureNbd ? 'insecure_nbd' : false}
      />
    )
  }
}

class Vlan extends BaseComponent {
  _editPif = vlan => editPif(this.props.network.defaultPif, { vlan })

  render() {
    const { defaultPif } = this.props.network

    if (!defaultPif) {
      return null
    }

    return (
      <span>
        <Number value={defaultPif.vlan} onChange={this._editPif}>
          {defaultPif.vlan === -1 ? 'None' : defaultPif.vlan}
        </Number>
      </span>
    )
  }
}

// -----------------------------------------------------------------------------

@connectStore(() => ({
  isInUse: createSelector(
    createGetObjectsOfType('VIF').pick((_, props) => props && props.network.VIFs),
    vifs => some(vifs, 'attached')
  ),
}))
class ToggleDefaultLockingMode extends Component {
  _editDefaultIsLocked = () => {
    const { network } = this.props
    editNetwork(network, { defaultIsLocked: !network.defaultIsLocked })
  }

  render() {
    const { isInUse, network } = this.props
    return conditionalTooltip(
      <Toggle disabled={isInUse} onChange={this._editDefaultIsLocked} value={network.defaultIsLocked} />,
      isInUse ? _('networkInUse') : undefined
    )
  }
}

// -----------------------------------------------------------------------------

@connectStore(() => {
  const disablePifUnplug = pif => pif.attached && !pif.isBondMaster && (pif.management || pif.disallowUnplug)

  const getDisableNetworkDelete = createSelector(
    () => createGetObjectsOfType('PIF').pick((_, props) => props.network.PIFs),
    (_, props) => props && props.network.name_label,
    (pifs, nameLabel) => nameLabel === 'Host internal management network' || some(pifs, disablePifUnplug)
  )

  return {
    disableNetworkDelete: getDisableNetworkDelete,
  }
})
class NetworkActions extends Component {
  render() {
    const { network, disableNetworkDelete } = this.props

    return (
      <ButtonGroup>
        <ActionRowButton
          handler={() => copy(network.uuid)}
          icon='clipboard'
          tooltip={_('copyUuid', { uuid: network.uuid })}
        />
        <ActionRowButton
          disabled={disableNetworkDelete}
          handler={deleteNetwork}
          handlerParam={network}
          icon='delete'
          tooltip={_('deleteNetwork')}
        />
      </ButtonGroup>
    )
  }
}

// =============================================================================

const NETWORKS_COLUMNS = [
  {
    name: _('poolNetworkNameLabel'),
    itemRenderer: network => <Name network={network} />,
    sortCriteria: network => network.name_label,
  },
  {
    name: _('poolNetworkDescription'),
    itemRenderer: network => <Description network={network} />,
    sortCriteria: network => network.name_description,
  },
  {
    name: _('pif'),
    itemRenderer: network => <DefaultPif network={network} />,
  },
  {
    name: _('pifVlanLabel'),
    itemRenderer: network => <Vlan network={network} />,

    // push entries without VLAN at the end
    sortCriteria: ({ defaultPif }) => (defaultPif === undefined || defaultPif.vlan === -1 ? Infinity : defaultPif.vlan),
  },
  {
    name: _('poolNetworkMTU'),
    itemRenderer: network => <Mtu network={network} />,
  },

  {
    itemRenderer: network => <Nbd network={network} />,
    name: <Tooltip content={_('nbdTooltip')}>{_('nbd')}</Tooltip>,
  },
  {
    name: (
      <div className='text-xs-center'>
        <Tooltip content={_('defaultLockingMode')}>
          <Icon size='lg' icon='lock' />
        </Tooltip>
      </div>
    ),
    itemRenderer: network => <ToggleDefaultLockingMode network={network} />,
  },
  {
    name: _('poolNetworkPif'),
    itemRenderer: network => !isEmpty(network.PIFs) && <PifsColumn network={network} />,
  },
  {
    name: _('poolNetworkAutomatic'),
    itemRenderer: network => <AutomaticNetwork network={network} />,
    tooltip: _('networkAutomaticTooltip'),
  },
  {
    name: '',
    itemRenderer: network => <NetworkActions network={network} />,
    textAlign: 'right',
  },
]

// =============================================================================

@connectStore(() => ({
  pifs: createGetObjectsOfType('PIF'),
}))
export default class TabNetworks extends Component {
  _getNetworks = createSelector(
    () => this.props.master,
    () => this.props.networks,
    () => this.props.pifs,
    (master, networks, pifs) =>
      networks.map(network => {
        for (const pifId of network.PIFs) {
          const pif = pifs[pifId]
          if (pif !== undefined && pif.$host === master.id) {
            return Object.defineProperty({ VLAN: pif.vlan, ...network }, 'defaultPif', { value: pif })
          }
        }

        return network
      })
  )

  render() {
    const networks = this._getNetworks()

    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            <TabButtonLink icon='add' labelId='networkCreateButton' to={`new/network?pool=${this.props.pool.id}`} />
          </Col>
        </Row>
        <Row>
          <Col>
            {!isEmpty(networks) ? (
              <SortedTable collection={networks} columns={NETWORKS_COLUMNS} stateUrlParam='s' />
            ) : (
              <h4 className='text-xs-center'>{_('poolNoNetwork')}</h4>
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}
