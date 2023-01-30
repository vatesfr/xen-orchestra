import _ from 'intl'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import Button from 'button'
import ButtonGroup from 'button-group'
import copy from 'copy-to-clipboard'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import some from 'lodash/some'
import SortedTable from 'sorted-table'
import Tooltip, { conditionalTooltip } from 'tooltip'
import { connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
import { TabButtonLink } from 'tab-button'
import { Text, Number } from 'editable'
import { Select, Toggle } from 'form'
import { createFinder, createGetObject, createGetObjectsOfType, createSelector } from 'selectors'
import { connectPif, deleteNetwork, disconnectPif, editNetwork, editPif } from 'xo'

// =============================================================================

const _createGetPifs = () => createGetObjectsOfType('PIF').pick((_, props) => props.network.PIFs)

const _createGetDefaultPif = () =>
  createFinder(
    _createGetPifs(),
    createSelector(
      createSelector(
        createGetObject((_, props) => props.network.$pool),
        pool => pool.master
      ),
      poolMaster => pif => pif.$host === poolMaster
    )
  )

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

@connectStore(() => ({
  defaultPif: _createGetDefaultPif(),
}))
class DefaultPif extends BaseComponent {
  _editPif = vlan => editPif(this.props.defaultPif, { vlan })

  render() {
    const { defaultPif } = this.props

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

@connectStore(() => ({
  defaultPif: _createGetDefaultPif(),
}))
class Vlan extends BaseComponent {
  _editPif = vlan => editPif(this.props.defaultPif, { vlan })

  render() {
    const { defaultPif } = this.props

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
  const pif = createGetObject()
  const host = createGetObject(createSelector(pif, pif => pif.$host))
  const disableUnplug = createSelector(
    pif,
    pif => pif.attached && !pif.isBondMaster && (pif.management || pif.disallowUnplug)
  )

  return { host, pif, disableUnplug }
})
class PifItem extends Component {
  render() {
    const { pif, host, disableUnplug } = this.props

    return (
      <tr>
        <td>{pif.device}</td>
        <td>{host.name_label}</td>
        <td>{pif.ip}</td>
        <td>{pif.mac}</td>
        <td>
          {pif.carrier ? (
            <span className='tag tag-success'>{_('poolNetworkPifAttached')}</span>
          ) : (
            <span className='tag tag-default'>{_('poolNetworkPifDetached')}</span>
          )}
        </td>
        <td className='text-xs-right'>
          <ButtonGroup>
            <ActionRowButton
              disabled={disableUnplug}
              handler={pif.attached ? disconnectPif : connectPif}
              handlerParam={pif}
              icon={pif.attached ? 'disconnect' : 'connect'}
              tooltip={pif.attached ? _('disconnectPif') : _('connectPif')}
            />
          </ButtonGroup>
        </td>
      </tr>
    )
  }
}

class PifsItem extends BaseComponent {
  render() {
    const { network } = this.props
    const { showPifs } = this.state

    return (
      <div>
        <Tooltip content={showPifs ? _('hidePifs') : _('showPifs')}>
          <Button size='small' className='mb-1 pull-right' onClick={this.toggleState('showPifs')}>
            <Icon icon={showPifs ? 'hidden' : 'shown'} />
          </Button>
        </Tooltip>
        {showPifs && (
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('pifDeviceLabel')}</th>
                <th>{_('homeTypeHost')}</th>
                <th>{_('pifAddressLabel')}</th>
                <th>{_('pifMacLabel')}</th>
                <th>{_('pifStatusLabel')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {map(network.PIFs, pifId => (
                <PifItem key={pifId} id={pifId} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }
}

// -----------------------------------------------------------------------------

@connectStore(() => {
  const disablePifUnplug = pif => pif.attached && !pif.isBondMaster && (pif.management || pif.disallowUnplug)

  const getDisableNetworkDelete = createSelector(
    _createGetPifs(),
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
  },
  {
    name: _('poolNetworkMTU'),
    itemRenderer: network => network.MTU,
  },

  {
    itemRenderer: network => <Nbd network={network} />,
    name: <Tooltip content={_('nbdTootltip')}>{_('nbd')}</Tooltip>,
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
    itemRenderer: network => !isEmpty(network.PIFs) && <PifsItem network={network} />,
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

export default class TabNetworks extends Component {
  render() {
    const { networks } = this.props

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
