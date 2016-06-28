import _, { messages } from 'intl'
import ActionButton from 'action-button'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import TabButton from 'tab-button'
import { connectStore, noop, propTypes } from 'utils'
import { Container, Row, Col } from 'grid'
import {
  createGetObjectsOfType,
  createSelector
} from 'selectors'
import { injectIntl } from 'react-intl'
import { SelectNetwork } from 'select-objects'

import {
  createVmInterface
} from 'xo'

@propTypes({
  onClose: propTypes.func,
  vm: propTypes.object.isRequired
})
@injectIntl
class NewVif extends Component {
  constructor (props) {
    super(props)
    this.state = {
      network: undefined
    }
  }
  _getNetworkPredicate = createSelector(
    () => {
      const { vm } = this.props
      return vm && vm.$pool
    },
    poolId => network => network.$pool === poolId
  )

  _selectNetwork = network => this.setState({network})

  _createVif = () => {
    const { vm, onClose = noop } = this.props
    const { mac, mtu } = this.refs
    const { network } = this.state
    return createVmInterface(vm, network, mac.value || undefined, mtu.value || undefined)
      .then(onClose)
  }

  render () {
    const formatMessage = this.props.intl.formatMessage
    return <form id='newVifForm'>
      <div className='form-group'>
        <SelectNetwork predicate={this._getNetworkPredicate()} onChange={this._selectNetwork} required />
      </div>
      <fieldset className='form-inline'>
        <div className='form-group'>
          <input type='text' ref='mac' placeholder={formatMessage(messages.vifMacLabel)} className='form-control' /> ({_('vifMacAutoGenerate')})
        </div>
        {' '}
        <div className='form-group'>
          <input type='text' ref='mtu' placeholder={formatMessage(messages.vifMtuLabel)} className='form-control' />
        </div>
        <span className='pull-right'>
          <ActionButton form='newVifForm' icon='add' btnStyle='primary' handler={this._createVif}>Create</ActionButton>
        </span>
      </fieldset>
    </form>
  }
}

@connectStore(() => {
  const vifs = createGetObjectsOfType('VIF').pick(
    (_, props) => props.vm.VIFs
  ).sort()
  const networks = createGetObjectsOfType('network').pick(
    createSelector(
      vifs,
      vifs => map(vifs, vif => vif.$network)
    )
  )

  return (state, props) => ({
    networks: networks(state, props),
    vifs: vifs(state, props)
  })
})
export default class TabNetwork extends Component {
  constructor (props) {
    super(props)
    this.state = {
      newVif: false
    }
  }

  _toggleNewVif = () => this.setState({
    newVif: !this.state.newVif
  })

  render () {
    const { newVif } = this.state
    const {
      networks,
      vifs,
      vm
    } = this.props

    return <Container>
      <Row>
        <Col className='text-xs-right'>
          <TabButton
            btnStyle='primary'
            handler={this._toggleNewVif}
            icon='add'
            labelId='vifCreateDeviceButton'
          />
        </Col>
      </Row>
      <Row>
        <Col>
          {newVif && <div><NewVif vm={vm} onClose={this._toggleNewVif} /><hr /></div>}
        </Col>
      </Row>
      <Row>
        <Col>
          {!isEmpty(vifs)
            ? <span>
              <table className='table' style={{ minWidth: '0' }}>
                <thead>
                  <tr>
                    <th>{_('vifDeviceLabel')}</th>
                    <th>{_('vifMacLabel')}</th>
                    <th>{_('vifMtuLabel')}</th>
                    <th>{_('vifNetworkLabel')}</th>
                    <th>{_('vifStatusLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {map(vifs, vif =>
                    <tr key={vif.id}>
                      <td>VIF #{vif.device}</td>
                      <td><pre>{vif.MAC}</pre></td>
                      <td>{vif.MTU}</td>
                      <td>{networks[vif.$network] && networks[vif.$network].name_label}</td>
                      <td>
                        {vif.attached
                          ? <span className='tag tag-success'>
                              {_('vifStatusConnected')}
                          </span>
                          : <span className='tag tag-default'>
                              {_('vifStatusDisconnected')}
                          </span>
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {vm.addresses && !isEmpty(vm.addresses)
                ? <span>
                  <h4>{_('vifIpAddresses')}</h4>
                  {map(vm.addresses, address => <span key={address} className='tag tag-info tag-ip'>{address}</span>)}
                </span>
                : _('noIpRecord')
              }
            </span>
            : <h4 className='text-xs-center'>{_('vifNoInterface')}</h4>
          }
        </Col>
      </Row>
    </Container>
  }
}
