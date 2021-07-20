import _, { messages } from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { alert, chooseAction, form } from 'modal'
import { Col, Container } from 'grid'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { generateId } from 'reaclette-utils'
import { get } from '@xen-orchestra/defined'
import { injectIntl } from 'react-intl'
import { provideState, injectState } from 'reaclette'
import { Select } from 'form'
import { SelectNetwork, SelectSr } from 'select-objects'
import { createProxyTrialLicense, deployProxyAppliance, getLicenses, isSrWritable } from 'xo'

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
      idHttpProxyInput: generateId,
      idIpInput: generateId,
      idNetmaskInput: generateId,
      idSelectNetwork: generateId,
      idSelectNetworkMode: generateId,
      idSelectSr: generateId,

      isStaticMode: (state, { value }) => value.networkMode === 'static',
      srPredicate:
        (state, { pbds, hosts }) =>
        sr =>
          isSrWritable(sr) && sr.$PBDs.some(pbd => get(() => hosts[pbds[pbd].host].hvmCapable)),
      networkPredicate: (state, { value }) => value.sr && (network => value.sr.$pool === network.$pool),
    },
  }),
  injectState,
  injectIntl,
  ({ effects, redeploy, state, value, intl: { formatMessage } }) => (
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
          <Label htmlFor={state.idSelectNetwork}>{_('destinationNetwork')}</Label>
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
      <SingleLineRow className='mt-1'>
        <Col mediumSize={4}>
          <Label htmlFor={state.idHttpProxyInput}>{_('httpProxy')}</Label>
        </Col>
        <Col mediumSize={8}>
          <input
            className='form-control'
            id={state.idHttpProxyInput}
            placeholder={formatMessage(messages.httpProxyPlaceholder)}
            name='httpProxy'
            onChange={effects.onInputChange}
            value={value.httpProxy}
          />
        </Col>
      </SingleLineRow>
      <SingleLineRow className='mt-1'>
        <Col mediumSize={4}>
          <Label htmlFor={state.idSelectNetworkMode}>{_('networkConfiguration')}</Label>
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
                placeholder={formatMessage(messages.proxyNetworkNetmaskPlaceHolder, {
                  netmask: DEFAULT_NETMASK,
                })}
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
                placeholder={formatMessage(messages.proxyNetworkDnsPlaceHolder, {
                  dns: DEFAULT_DNS,
                })}
                value={value.dns}
              />
            </Col>
          </SingleLineRow>
        </div>
      )}
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

const deployProxy = async ({ proxy } = {}) => {
  const licenses = await getLicenses({ productType: 'xoproxy' })
  const isRedeployMode = proxy !== undefined

  let license
  if (isRedeployMode) {
    license = licenses.find(license => !(license.expires < Date.now()) && license.boundObjectId === proxy.vmUuid)
  }

  // in case of deploying a proxy or when the associated proxy VM doesn't have a license
  if (license === undefined) {
    license = licenses.find(license => !(license.expires < Date.now()) && license.boundObjectId === undefined)
  }

  const title = isRedeployMode ? _('redeployProxy') : _('deployProxy')
  if (license === undefined) {
    // it rejects with undefined when the start trial option isn't chosen
    await chooseAction({
      body: (
        <div className='text-muted'>
          <Icon icon='info' /> {_('noLicenseAvailable')}
        </div>
      ),
      buttons: [
        {
          btnStyle: 'success',
          icon: 'trial',
          label: _('trialStartButton'),
        },
      ],
      icon: 'proxy',
      title,
    })

    try {
      license = await createProxyTrialLicense()
    } catch (error) {
      await alert(
        _('trialStartButton'),
        <span className='text-danger'>
          <Icon icon='alarm' /> {error.message}
        </span>
      )

      // throw undefined to interrupt the deployment process and let the ActionButton properly ignore this error
      throw undefined
    }
  }

  return form({
    defaultValue: {
      dns: '',
      gateway: '',
      httpProxy: '',
      ip: '',
      netmask: '',
      networkMode: 'dhcp',
    },
    render: props => <Modal {...props} redeploy={isRedeployMode} />,
    header: (
      <span>
        <Icon icon='proxy' /> {title}
      </span>
    ),
  }).then(({ httpProxy, sr, network, networkMode, ip, netmask, gateway, dns }) =>
    deployProxyAppliance(license, sr, {
      httpProxy: (httpProxy = httpProxy.trim()) !== '' ? httpProxy : undefined,
      network: network === null ? undefined : network,
      networkConfiguration:
        networkMode === 'static'
          ? {
              dns: (dns = dns.trim()) === '' ? DEFAULT_DNS : dns,
              gateway,
              ip,
              netmask: (netmask = netmask.trim()) === '' ? DEFAULT_NETMASK : netmask,
            }
          : undefined,
      proxy,
    })
  )
}

export { deployProxy as default }
