import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Copiable from 'copiable'
import decorate from 'apply-decorators'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import SelectFiles from 'select-files'
import StateButton from 'state-button'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, compareVersions, connectStore, formatSize, getIscsiPaths } from 'utils'
import { confirm, form } from 'modal'
import { Container, Row, Col } from 'grid'
import { CustomFields } from 'custom-fields'
import { createGetObject, createGetObjectsOfType, createSelector } from 'selectors'
import { forEach, isEmpty, map, noop } from 'lodash'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Sr } from 'render-xo-item'
import { Text } from 'editable'
import { Toggle, Select, SizeInput } from 'form'
import {
  detachHost,
  disableHost,
  editHost,
  enableAdvancedLiveTelemetry,
  enableHost,
  forgetHost,
  installSupplementalPack,
  isHyperThreadingEnabledHost,
  isNetDataInstalledOnHost,
  getPlugin,
  restartHost,
  setControlDomainMemory,
  setHostsMultipathing,
  setRemoteSyslogHost,
  setSchedulerGranularity,
  subscribeSchedulerGranularity,
  toggleMaintenanceMode,
} from 'xo'

import { installCertificate } from './install-certificate'

const ALLOW_INSTALL_SUPP_PACK = process.env.XOA_PLAN > 1

const SCHED_GRAN_TYPE_OPTIONS = [
  {
    label: _('core'),
    value: 'core',
  },
  {
    label: _('cpu'),
    value: 'cpu',
  },
  {
    label: _('socket'),
    value: 'socket',
  },
]

const forceReboot = host => restartHost(host, true)

const formatPack = ({ name, author, description, version }, key) => (
  <tr key={key}>
    <th>{_('supplementalPackTitle', { author, name })}</th>
    <td>{description}</td>
    <td>{version}</td>
  </tr>
)

const getPackId = ({ author, name }) => `${author}\0${name}`

const SetControlDomainMemory = ({ value, onChange }) => (
  <Container>
    <Row className='mb-1'>
      <Col>
        <Icon icon='error' /> {_('setControlDomainMemoryMessage')}
      </Col>
    </Row>
    <Row>
      <Col size={6}>{_('vmMemory')}</Col>
      <Col size={6}>
        <SizeInput required value={value} onChange={onChange} />
      </Col>
    </Row>
  </Container>
)

const MultipathableSrs = decorate([
  connectStore({
    pbds: createGetObjectsOfType('PBD').filter(
      (_, { hostId }) =>
        pbd =>
          pbd.host === hostId && Boolean(pbd.otherConfig.multipathed)
    ),
  }),
  ({ pbds }) =>
    isEmpty(pbds) ? (
      <div>{_('hostNoIscsiSr')}</div>
    ) : (
      <Container>
        {map(pbds, pbd => {
          const [nActives, nPaths] = getIscsiPaths(pbd)
          const nSessions = pbd.otherConfig.iscsi_sessions
          return (
            <Row key={pbd.id}>
              <Col>
                <Sr id={pbd.SR} link newTab container={false} />{' '}
                {nActives !== undefined &&
                  nPaths !== undefined &&
                  _('hostMultipathingPaths', {
                    nActives,
                    nPaths,
                  })}{' '}
                {nSessions !== undefined && _('iscsiSessions', { nSessions })}
              </Col>
            </Row>
          )
        })}
      </Container>
    ),
])

MultipathableSrs.propTypes = {
  hostId: PropTypes.string.isRequired,
}

@addSubscriptions(props => ({
  schedGran: cb => subscribeSchedulerGranularity(props.host.id, cb),
}))
@connectStore(() => {
  const getControlDomain = createGetObject((_, { host }) => host.controlDomain)

  const getPgpus = createGetObjectsOfType('PGPU')
    .pick((_, { host }) => host.$PGPUs)
    .sort()

  const getPcis = createGetObjectsOfType('PCI').pick(createSelector(getPgpus, pgpus => map(pgpus, 'pci')))

  return {
    controlDomain: getControlDomain,
    pcis: getPcis,
    pgpus: getPgpus,
  }
})
export default class extends Component {
  async componentDidMount() {
    const plugin = await getPlugin('netdata')
    const isNetDataPluginCorrectlySet = plugin !== undefined && plugin.loaded
    this.setState({ isNetDataPluginCorrectlySet })
    if (isNetDataPluginCorrectlySet) {
      this.setState({
        isNetDataPluginInstalledOnHost: await isNetDataInstalledOnHost(this.props.host),
      })
    }

    this.setState({
      isHtEnabled: await isHyperThreadingEnabledHost(this.props.host),
    })
  }

  _getPacks = createSelector(
    () => this.props.host.supplementalPacks,
    packs => {
      const uniqPacks = {}
      let packId, previousPack
      forEach(packs, pack => {
        packId = getPackId(pack)
        if (
          (previousPack = uniqPacks[packId]) === undefined ||
          compareVersions(pack.version, previousPack.version) > 0
        ) {
          uniqPacks[packId] = pack
        }
      })
      return uniqPacks
    }
  )

  _setSchedulerGranularity = value => setSchedulerGranularity(this.props.host.id, value)

  _setHostIscsiIqn = iscsiIqn =>
    confirm({
      icon: 'alarm',
      title: _('editHostIscsiIqnTitle'),
      body: (
        <div>
          <p>{_('editHostIscsiIqnMessage')}</p>
          <p className='text-muted'>
            <Icon icon='info' /> {_('uniqueHostIscsiIqnInfo')}
          </p>
        </div>
      ),
    }).then(() => editHost(this.props.host, { iscsiIqn }), noop)

  _setRemoteSyslogHost = value => setRemoteSyslogHost(this.props.host, value)

  _setControlDomainMemory = () =>
    form({
      component: SetControlDomainMemory,
      defaultValue: this.props.controlDomain.memory.size,
      header: (
        <span>
          <Icon icon='memory' /> {_('setControlDomainMemory')}
        </span>
      ),
    }).then(memory => setControlDomainMemory(this.props.host.id, memory), noop)

  _accessAdvancedLiveTelemetry = () => window.open(`/netdata/host/${encodeURIComponent(this.props.host.hostname)}/`)

  _enableAdvancedLiveTelemetry = async host => {
    await enableAdvancedLiveTelemetry(host)
    this.setState({
      isNetDataPluginInstalledOnHost: await isNetDataInstalledOnHost(host),
    })
  }

  render() {
    const { controlDomain, host, pcis, pgpus, schedGran } = this.props
    const { isHtEnabled, isNetDataPluginInstalledOnHost, isNetDataPluginCorrectlySet } = this.state

    const _isXcpNgHost = host.productBrand === 'XCP-ng'

    const telemetryButton = isNetDataPluginInstalledOnHost ? (
      <TabButton
        btnStyle='success'
        handler={this._accessAdvancedLiveTelemetry}
        handlerParam={host}
        icon='telemetry'
        labelId='advancedLiveTelemetry'
      />
    ) : (
      <TabButton
        btnStyle='success'
        disabled={!_isXcpNgHost || !isNetDataPluginCorrectlySet}
        handler={this._enableAdvancedLiveTelemetry}
        handlerParam={host}
        icon='telemetry'
        labelId='enableAdvancedLiveTelemetry'
      />
    )

    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            {!isNetDataPluginCorrectlySet ? (
              <Tooltip content={_('pluginNetDataIsNecessary')}>{telemetryButton}</Tooltip>
            ) : !_isXcpNgHost ? (
              <Tooltip content={_('xcpOnlyFeature')}>{telemetryButton}</Tooltip>
            ) : (
              telemetryButton
            )}
            {host.power_state === 'Running' && (
              <TabButton
                btnStyle='warning'
                handler={forceReboot}
                handlerParam={host}
                icon='host-force-reboot'
                labelId='forceRebootHostLabel'
              />
            )}
            {host.enabled ? (
              <TabButton
                btnStyle='warning'
                handler={toggleMaintenanceMode}
                handlerParam={host}
                icon='host-disable'
                labelId='enableMaintenanceMode'
                tooltip={_('maintenanceHostTooltip')}
              />
            ) : (
              <TabButton
                btnStyle='success'
                handler={toggleMaintenanceMode}
                handlerParam={host}
                icon='host-enable'
                labelId='disableMaintenanceMode'
              />
            )}
            {host.enabled ? (
              <TabButton
                btnStyle='warning'
                handler={disableHost}
                handlerParam={host}
                icon='host-forget'
                labelId='disableHostLabel'
              />
            ) : (
              <TabButton
                btnStyle='success'
                handler={enableHost}
                handlerParam={host}
                icon='host-enable'
                labelId='enableHostLabel'
              />
            )}

            <TabButton
              btnStyle='danger'
              handler={detachHost}
              handlerParam={host}
              icon='host-eject'
              labelId='detachHost'
            />
            {host.power_state !== 'Running' && (
              <TabButton
                btnStyle='danger'
                handler={forgetHost}
                handlerParam={host}
                icon='host-forget'
                labelId='forgetHost'
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col>
            <h3>{_('xenSettingsLabel')}</h3>
            <table className='table'>
              <tbody>
                <tr>
                  <th>{_('hostAddress')}</th>
                  <Copiable tagName='td'>{host.address}</Copiable>
                </tr>
                <tr>
                  <th>{_('hostStatus')}</th>
                  <td>{host.enabled ? _('hostStatusEnabled') : _('hostStatusDisabled')}</td>
                </tr>
                {host.chipset_info.iommu !== undefined && (
                  <tr>
                    <th>
                      <Tooltip content={_('hostIommuTooltip')}>{_('hostIommu')}</Tooltip>
                    </th>
                    <td>{host.chipset_info.iommu ? _('stateEnabled') : _('stateDisabled')}</td>
                  </tr>
                )}
                <tr>
                  <th>{_('hostPowerOnMode')}</th>
                  <td>
                    <Toggle disabled onChange={noop} value={Boolean(host.powerOnMode)} />
                  </td>
                </tr>
                <tr>
                  <th>{_('hostControlDomainMemory')}</th>
                  <td>
                    {controlDomain !== undefined && (
                      <span>
                        {formatSize(controlDomain.memory.size)}{' '}
                        <Tooltip content={host.enabled ? _('maintenanceModeRequired') : _('setControlDomainMemory')}>
                          <ActionButton
                            btnStyle='primary'
                            disabled={host.enabled}
                            handler={this._setControlDomainMemory}
                            icon='edit'
                            size='small'
                          />
                        </Tooltip>
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{_('hostStartedSince')}</th>
                  <td>
                    {_('started', {
                      ago: <FormattedRelative value={host.startTime * 1000} />,
                    })}
                  </td>
                </tr>
                <tr>
                  <th>{_('hostStackStartedSince')}</th>
                  <td>
                    {_('started', {
                      ago: <FormattedRelative value={host.agentStartTime * 1000} />,
                    })}
                  </td>
                </tr>
                <tr>
                  <th>{_('hostXenServerVersion')}</th>
                  <Copiable tagName='td' data={host.version}>
                    {host.license_params.sku_marketing_name} {host.version} ({host.license_params.sku_type})
                  </Copiable>
                </tr>
                <tr>
                  <th>{_('hostBuildNumber')}</th>
                  <Copiable tagName='td'>{host.build}</Copiable>
                </tr>
                <tr>
                  <th>{_('hostIscsiIqn')}</th>
                  <td>
                    <Text onChange={this._setHostIscsiIqn} value={host.iscsiIqn} />
                  </td>
                </tr>
                <tr>
                  <th>{_('multipathing')}</th>
                  <td>
                    <StateButton
                      className='mb-1'
                      data-host={host}
                      data-multipathing={!host.multipathing}
                      disabledLabel={_('stateDisabled')}
                      disabledTooltip={_('enableMultipathing')}
                      enabledLabel={_('stateEnabled')}
                      enabledTooltip={_('disableMultipathing')}
                      handler={setHostsMultipathing}
                      state={host.multipathing}
                    />
                    {host.multipathing && <MultipathableSrs hostId={host.id} />}
                  </td>
                </tr>
                {schedGran != null && (
                  <tr>
                    <th>{_('schedulerGranularity')}</th>
                    <td>
                      <Select
                        onChange={this._setSchedulerGranularity}
                        options={SCHED_GRAN_TYPE_OPTIONS}
                        required
                        simpleValue
                        value={schedGran}
                      />
                      <small>{_('rebootUpdateHostLabel')}</small>
                    </td>
                  </tr>
                )}
                <tr>
                  <th>{_('hostRemoteSyslog')}</th>
                  <td>
                    <Text value={host.logging.syslog_destination || ''} onChange={this._setRemoteSyslogHost} />
                  </td>
                </tr>
                <tr>
                  <th>{_('customFields')}</th>
                  <td>
                    <CustomFields object={host.id} />
                  </td>
                </tr>
              </tbody>
            </table>
            <br />
            <h3>{_('hardwareHostSettingsLabel')}</h3>
            <table className='table'>
              <tbody>
                <tr>
                  <th>{_('hostCpusModel')}</th>
                  <Copiable tagName='td'>{host.CPUs.modelname}</Copiable>
                </tr>
                <tr>
                  <th>{_('hostGpus')}</th>
                  <td>{map(pgpus, pgpu => pcis[pgpu.pci].device_name).join(', ')}</td>
                </tr>
                <tr>
                  <th>{_('hostCpusNumber')}</th>
                  <td>
                    {host.cpus.cores} ({host.cpus.sockets})
                  </td>
                </tr>
                <tr>
                  <th>{_('hyperThreading')}</th>
                  <td>
                    {isHtEnabled === null
                      ? _('hyperThreadingNotAvailable')
                      : isHtEnabled
                      ? _('stateEnabled')
                      : _('stateDisabled')}
                  </td>
                </tr>
                <tr>
                  <th>{_('hostManufacturerinfo')}</th>
                  <Copiable tagName='td'>
                    {host.bios_strings['system-manufacturer']} ({host.bios_strings['system-product-name']})
                  </Copiable>
                </tr>
                <tr>
                  <th>{_('hostBiosinfo')}</th>
                  <td>
                    {host.bios_strings['bios-vendor']} ({host.bios_strings['bios-version']})
                  </td>
                </tr>
              </tbody>
            </table>
            <br />
            <h3>{_('licenseHostSettingsLabel')}</h3>
            <table className='table'>
              <tbody>
                <tr>
                  <th>{_('hostLicenseType')}</th>
                  <td>{host.license_params.sku_type}</td>
                </tr>
                <tr>
                  <th>{_('hostLicenseSocket')}</th>
                  <td>{host.license_params.sockets}</td>
                </tr>
                <tr>
                  <th>{_('hostLicenseExpiry')}</th>
                  <td>
                    <FormattedTime value={host.license_expiry * 1000} day='numeric' month='long' year='numeric' />
                    <br />
                  </td>
                </tr>
              </tbody>
            </table>
            <h3>{_('supplementalPacks')}</h3>
            <table className='table'>
              <tbody>
                {map(this._getPacks(), formatPack)}
                {ALLOW_INSTALL_SUPP_PACK && (
                  <tr>
                    <th>{_('supplementalPackNew')}</th>
                    <td>
                      <SelectFiles type='file' onChange={file => installSupplementalPack(host, file)} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {!ALLOW_INSTALL_SUPP_PACK && [
              <h3>{_('supplementalPackNew')}</h3>,
              <Container>
                <Upgrade place='supplementalPacks' available={2} />
              </Container>,
            ]}
            {host.certificates !== undefined && (
              <div>
                <h3>
                  {_('installedCertificates')}{' '}
                  <ActionButton
                    btnStyle='success'
                    data-id={host.id}
                    data-isNewInstallation={host.certificates.length === 0}
                    handler={installCertificate}
                    icon='upload'
                  >
                    {host.certificates.length > 0 ? _('replaceExistingCertificate') : _('installNewCertificate')}
                  </ActionButton>
                </h3>
                {host.certificates.length > 0 ? (
                  <ul className='list-group'>
                    {host.certificates.map(({ fingerprint, notAfter }) => (
                      <li className='list-group-item' key={fingerprint}>
                        <Container>
                          <Row>
                            <Col mediumSize={2}>
                              <strong>{_('fingerprint')}</strong>
                            </Col>
                            <Col mediumSize={10}>
                              <Copiable tagName='pre'>{fingerprint}</Copiable>
                            </Col>
                          </Row>
                          <Row>
                            <Col mediumSize={2}>
                              <strong>{_('expiry')}</strong>
                            </Col>
                            <Col mediumSize={10}>
                              <FormattedTime value={notAfter * 1e3} day='numeric' month='long' year='numeric' />
                            </Col>
                          </Row>
                        </Container>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span>{_('hostNoCertificateInstalled')}</span>
                )}
              </div>
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}
