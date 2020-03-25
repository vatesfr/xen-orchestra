import _, { messages } from 'intl'
import decorate from 'apply-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Col } from 'grid'
import { generateId } from 'reaclette-utils'
import { injectIntl } from 'react-intl'
import { provideState, injectState } from 'reaclette'
import { Select } from 'form'

import Label from './label'

const NETWORK_MODE_OPTIONS = [
  {
    label: _('dhcp'),
    value: 'dhcp',
  },
  {
    label: _('static'),
    value: 'static',
  },
]

const DEFAULT_DNS = '8.8.8.8'
const DEFAULT_NETMASK = '255.255.255.0'

const NetworkConfiguration = decorate([
  provideState({
    effects: {
      onNetworkModeChange(_, networkMode) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          networkMode,
        })
      },
      onInputChange(_, { target }) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          [target.name]: target.value,
        })
      },
    },
    computed: {
      idDnsInput: generateId,
      idGatewayInput: generateId,
      idIpInput: generateId,
      idNetmaskInput: generateId,
      idSelectNetworkMode: generateId,

      isStaticMode: (state, { value }) => value.networkMode === 'static',
    },
  }),
  injectState,
  injectIntl,
  ({ effects, state, value, intl: { formatMessage } }) => (
    <div>
      <SingleLineRow>
        <Col mediumSize={4}>
          <Label htmlFor={state.idSelectNetworkMode}>
            {_('networkConfiguration')}
          </Label>
        </Col>
        <Col mediumSize={8}>
          <Select
            id={state.idSelectNetworkMode}
            onChange={effects.onNetworkModeChange}
            options={NETWORK_MODE_OPTIONS}
            required
            simpleValue
            value={value.networkMode}
          />
        </Col>
      </SingleLineRow>
      {state.isStaticMode && (
        <div>
          <SingleLineRow className='mt-1'>
            <Col mediumSize={4}>
              <Label htmlFor={state.idIpInput}>{_('ip')}</Label>
            </Col>
            <Col mediumSize={8}>
              <input
                className='form-control'
                id={state.idIpInput}
                name='ip'
                onChange={effects.onInputChange}
                pattern='[^\s]+'
                required={state.isStaticMode}
                value={value.ip}
              />
            </Col>
          </SingleLineRow>
          <SingleLineRow className='mt-1'>
            <Col mediumSize={4}>
              <Label htmlFor={state.idNetmaskInput}>{_('netmask')}</Label>
            </Col>
            <Col mediumSize={8}>
              <input
                className='form-control'
                id={state.idNetmaskInput}
                name='netmask'
                onChange={effects.onInputChange}
                placeholder={formatMessage(
                  messages.proxyNetworkNetmaskPlaceHolder,
                  {
                    netmask: DEFAULT_NETMASK,
                  }
                )}
                value={value.netmask}
              />
            </Col>
          </SingleLineRow>
          <SingleLineRow className='mt-1'>
            <Col mediumSize={4}>
              <Label htmlFor={state.idGatewayInput}>{_('gateway')}</Label>
            </Col>
            <Col mediumSize={8}>
              <input
                className='form-control'
                id={state.idGatewayInput}
                name='gateway'
                onChange={effects.onInputChange}
                pattern='[^\s]+'
                required={state.isStaticMode}
                value={value.gateway}
              />
            </Col>
          </SingleLineRow>
          <SingleLineRow className='mt-1'>
            <Col mediumSize={4}>
              <Label htmlFor={state.idDnsInput}>{_('dns')}</Label>
            </Col>
            <Col mediumSize={8}>
              <input
                className='form-control'
                id={state.idDnsInput}
                name='dns'
                onChange={effects.onInputChange}
                placeholder={formatMessage(
                  messages.proxyNetworkDnsPlaceHolder,
                  {
                    dns: DEFAULT_DNS,
                  }
                )}
                value={value.dns}
              />
            </Col>
          </SingleLineRow>
        </div>
      )}
    </div>
  ),
])

NetworkConfiguration.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.object.isRequired,
}

const getNetworkConfiguration = ({ networkMode, ip, netmask, gateway, dns }) =>
  networkMode === 'static'
    ? {
        dns: (dns = dns.trim()) === '' ? DEFAULT_DNS : dns,
        gateway,
        ip,
        netmask: (netmask = netmask.trim()) === '' ? DEFAULT_NETMASK : netmask,
      }
    : undefined

const NETWORK_CONFIGURATION_DEFAULT_VALUES = {
  dns: '',
  gateway: '',
  ip: '',
  netmask: '',
  networkMode: 'dhcp',
}

export {
  getNetworkConfiguration,
  NETWORK_CONFIGURATION_DEFAULT_VALUES,
  NetworkConfiguration as default,
}
