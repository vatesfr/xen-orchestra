import _ from 'intl'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import Button from 'button'
import ButtonGroup from 'button-group'
import Icon from 'icon'
import map from 'lodash/map'
import React, { Component } from 'react'
import Tooltip from 'tooltip'
import { connectStore } from 'utils'
import { createGetObject, createGetObjectsOfType, createSelector } from 'selectors'
import { connectPif, disconnectPif } from 'xo'

@connectStore(() => {
  const pif = createGetObject()
  const host = createGetObject(createSelector(pif, pif => pif?.$host))
  const disableUnplug = createSelector(
    pif,
    pif => pif?.attached && !pif?.isBondMaster && (pif?.management || pif?.disallowUnplug)
  )

  const bonds = createGetObjectsOfType('bond')
  const bond = createSelector(pif, bonds, (pif, bonds) => Object.values(bonds).find(bond => bond.master === pif.id))

  return { host, pif, disableUnplug, bond }
})
class PifItem extends Component {
  render() {
    const { pif, host, disableUnplug, bond } = this.props

    return (
      <tr>
        <td>{pif?.device ?? _('unknown')}</td>
        <td>{host?.name_label ?? _('unknown')}</td>
        <td>{pif?.ip ?? _('unknown')}</td>
        <td>{pif?.mac ?? _('unknown')}</td>
        <td>{bond?.mode ?? _('unknown')} </td>
        <td>
          {pif?.carrier === undefined ? (
            <span className='tag tag-warning'>{_('unknown')}</span>
          ) : pif.carrier ? (
            <span className='tag tag-success'>{_('poolNetworkPifAttached')}</span>
          ) : (
            <span className='tag tag-default'>{_('poolNetworkPifDetached')}</span>
          )}
        </td>
        <td className='text-xs-right'>
          {pif !== undefined && (
            <ButtonGroup>
              <ActionRowButton
                disabled={disableUnplug}
                handler={pif.attached ? disconnectPif : connectPif}
                handlerParam={pif}
                icon={pif.attached ? 'disconnect' : 'connect'}
                tooltip={pif.attached ? _('disconnectPif') : _('connectPif')}
              />
            </ButtonGroup>
          )}
        </td>
      </tr>
    )
  }
}

export default class PifsColumn extends BaseComponent {
  render() {
    const { network, pifs } = this.props
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
                <th>{_('bondMode')} </th>
                <th>{_('pifStatusLabel')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {map(network?.PIFs ?? pifs, (pifId, index) => (
                <PifItem key={pifId ?? index} id={pifId} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }
}
