import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { Col, Container } from 'grid'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { deployProxyAppliance, isSrWritable } from 'xo'
import { form } from 'modal'
import { generateId } from 'reaclette-utils'
import { get } from '@xen-orchestra/defined'
import { provideState, injectState } from 'reaclette'
import { SelectNetwork, SelectSr } from 'select-objects'

import Label from './label'
import NetworkConfiguration, {
  getNetworkConfiguration,
  NETWORK_CONFIGURATION_DEFAULT_VALUES,
} from './network-configuration'

const Modal = decorate([
  connectStore({
    hosts: createGetObjectsOfType('host'),
    pbds: createGetObjectsOfType('PBD'),
  }),
  provideState({
    effects: {
      onSrChange(_, sr) {
        this.props.onChange({
          ...this.props.value,
          sr,
        })
      },
      onNetworkChange(_, network) {
        this.props.onChange({
          ...this.props.value,
          network,
        })
      },
    },
    computed: {
      idSelectNetwork: generateId,
      idSelectSr: generateId,

      srPredicate: (state, { pbds, hosts }) => sr =>
        isSrWritable(sr) &&
        sr.$PBDs.some(pbd => get(() => hosts[pbds[pbd].host].hvmCapable)),
      networkPredicate: (state, { value }) =>
        value.sr && (network => value.sr.$pool === network.$pool),
    },
  }),
  injectState,
  ({ effects, onChange, redeploy, state, value }) => (
    <Container>
      <SingleLineRow>
        <Col mediumSize={4}>
          <Label htmlFor={state.idSelectSr}>
            {_('destinationSR')}{' '}
            <Tooltip content={_('proxySrPredicateInfo')}>
              <Icon icon='info' />
            </Tooltip>
          </Label>
        </Col>
        <Col mediumSize={8}>
          <SelectSr
            id={state.idSelectSr}
            onChange={effects.onSrChange}
            predicate={state.srPredicate}
            required
            value={value.sr}
          />
        </Col>
      </SingleLineRow>
      <SingleLineRow className='mt-1'>
        <Col mediumSize={4}>
          <Label htmlFor={state.idSelectNetwork}>
            {_('destinationNetwork')}
          </Label>
        </Col>
        <Col mediumSize={8}>
          <SelectNetwork
            disabled={value.sr === undefined}
            id={state.idSelectNetwork}
            onChange={effects.onNetworkChange}
            predicate={state.networkPredicate}
            value={value.network}
          />
        </Col>
      </SingleLineRow>
      <NetworkConfiguration onChange={onChange} value={value} />
      {redeploy && (
        <SingleLineRow className='mt-1'>
          <Col className='text-warning'>
            <Icon icon='alarm' /> {_('redeployProxyWarning')}
          </Col>
        </SingleLineRow>
      )}
    </Container>
  ),
])

const deployProxy = proxy => {
  const isRedeployMode = proxy !== undefined
  return form({
    defaultValue: NETWORK_CONFIGURATION_DEFAULT_VALUES,
    render: props => <Modal {...props} redeploy={isRedeployMode} />,
    header: (
      <span>
        <Icon icon='proxy' />{' '}
        {isRedeployMode ? _('redeployProxy') : _('deployProxy')}
      </span>
    ),
  }).then(({ sr, network, ...networkConfiguration }) =>
    deployProxyAppliance(sr, {
      network: network === null ? undefined : network,
      networkConfiguration: getNetworkConfiguration(networkConfiguration),
      proxy,
    })
  )
}

export { deployProxy as default }
