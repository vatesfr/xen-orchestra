import _, { messages } from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Col, Container } from 'grid'
import { deployProxyAppliance } from 'xo'
import { form } from 'modal'
import { generateId } from 'reaclette-utils'
import { injectIntl } from 'react-intl'
import { provideState, injectState } from 'reaclette'
import { Select } from 'form'
import { SelectSr } from 'select-objects'

const Label = ({ children, ...props }) => (
  <label {...props} style={{ cursor: 'pointer' }}>
    <strong>{children}</strong>
  </label>
)

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

const Modal = decorate([
  provideState({
    effects: {
      onSrChange(_, sr) {
        this.props.onChange({
          ...this.props.value,
          sr,
        })
      },
      onNetworkModeChange(_, networkMode) {
        this.props.onChange({
          ...this.props.value,
          networkMode,
        })
      },
      onInputChange(_, { target: { name, value } }) {
        this.props.onChange({
          ...this.props.value,
          [name]: value,
        })
      },
    },
    computed: {
      idDnsInput: generateId,
      idGatewayInput: generateId,
      idIpInput: generateId,
      idNetmaskInput: generateId,
      idSelectNetworkMode: generateId,
      idSelectSr: generateId,

      isStaticMode: (state, { value }) => value.networkMode === 'static',
    },
  }),
  injectState,
  injectIntl,
  ({ effects, reDeploy, state, value, intl: { formatMessage } }) => (
    <Container>
      <SingleLineRow>
        <Col mediumSize={4}>
          <Label htmlFor={state.idSelectSr}>{_('destinationSR')}</Label>
        </Col>
        <Col mediumSize={8}>
          <SelectSr
            id={state.idSelectSr}
            onChange={effects.onSrChange}
            required
            value={value.sr}
          />
        </Col>
      </SingleLineRow>
      <SingleLineRow className='mt-1'>
        <Col mediumSize={4}>
          <Label htmlFor={state.idSelectNetworkMode}>{_('network')}</Label>
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
      {reDeploy && (
        <SingleLineRow className='mt-1'>
          <Col className='text-warning'>
            <Icon icon='alarm' /> {_('reDeployProxyWarning')}
          </Col>
        </SingleLineRow>
      )}
    </Container>
  ),
])

const deployProxy = proxy => {
  const isReDeployMode = proxy !== undefined
  return form({
    defaultValue: {
      dns: '',
      gateway: '',
      ip: '',
      netmask: '',
      networkMode: 'dhcp',
    },
    render: props => <Modal {...props} reDeploy={isReDeployMode} />,
    header: (
      <span>
        <Icon icon='proxy' />{' '}
        {isReDeployMode ? _('reDeployProxy') : _('deployProxy')}
      </span>
    ),
  }).then(({ sr, networkMode, ip, netmask, gateway, dns }) =>
    deployProxyAppliance(sr, {
      network:
        networkMode === 'static'
          ? {
              dns: (dns = dns.trim()) === '' ? DEFAULT_DNS : dns,
              gateway,
              ip,
              netmask:
                (netmask = netmask.trim()) === '' ? DEFAULT_NETMASK : netmask,
            }
          : undefined,
      proxy,
    })
  )
}

export { deployProxy as default }
