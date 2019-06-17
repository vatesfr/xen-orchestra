import _ from 'intl'
import Component from 'base-component'
import Copiable from 'copiable'
import decorate from 'apply-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import SelectFiles from 'select-files'
import StateButton from 'state-button'
import TabButton from 'tab-button'
import Upgrade from 'xoa-upgrade'
import { compareVersions, connectStore, getIscsiPaths } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { forEach, map, noop, isEmpty } from 'lodash'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Sr } from 'render-xo-item'
import { Text } from 'editable'
import { Toggle } from 'form'
import {
  detachHost,
  disableHost,
  enableHost,
  forgetHost,
  getHyperthreadingHost,
  installSupplementalPack,
  restartHost,
  setHostsMultipathing,
  setRemoteSyslogHost,
} from 'xo'

const ALLOW_INSTALL_SUPP_PACK = process.env.XOA_PLAN > 1

const forceReboot = host => restartHost(host, true)

const formatPack = ({ name, author, description, version }, key) => (
  <tr key={key}>
    <th>{_('supplementalPackTitle', { author, name })}</th>
    <td>{description}</td>
    <td>{version}</td>
  </tr>
)

const getPackId = ({ author, name }) => `${author}\0${name}`

const MultipathableSrs = decorate([
  connectStore({
    pbds: createGetObjectsOfType('PBD').filter((_, { hostId }) => pbd =>
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
          return (
            <Row key={pbd.id}>
              <Col>
                <Sr id={pbd.SR} link newTab container={false} />{' '}
                {nActives !== undefined &&
                  nPaths !== undefined &&
                  _('hostMultipathingPaths', {
                    nActives,
                    nPaths,
                    nSessions: pbd.otherConfig.iscsi_sessions,
                  })}
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

@connectStore(() => {
  const getPgpus = createGetObjectsOfType('PGPU')
    .pick((_, { host }) => host.$PGPUs)
    .sort()

  const getPcis = createGetObjectsOfType('PCI').pick(
    createSelector(
      getPgpus,
      pgpus => map(pgpus, 'pci')
    )
  )

  return {
    pcis: getPcis,
    pgpus: getPgpus,
  }
})
export default class extends Component {
  async componentDidMount() {
    const res = await getHyperthreadingHost(this.props.host)
    // create a computed that determine if hyperthreading is enabled
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
  _isHtEnabled = createSelector(
    () => this.props.host.CPUs.flags,
    flags => /\bht\b/.test(flags)
  )
  _setRemoteSyslogHost = value => setRemoteSyslogHost(this.props.host, value)

  render() {
    const { host, pcis, pgpus } = this.props
    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
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
                handler={disableHost}
                handlerParam={host}
                icon='host-disable'
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
                  <td>
                    {host.enabled
                      ? _('hostStatusEnabled')
                      : _('hostStatusDisabled')}
                  </td>
                </tr>
                <tr>
                  <th>{_('hostPowerOnMode')}</th>
                  <td>
                    <Toggle
                      disabled
                      onChange={noop}
                      value={Boolean(host.powerOnMode)}
                    />
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
                      ago: (
                        <FormattedRelative value={host.agentStartTime * 1000} />
                      ),
                    })}
                  </td>
                </tr>
                <tr>
                  <th>{_('hostXenServerVersion')}</th>
                  <Copiable tagName='td' data={host.version}>
                    {host.license_params.sku_marketing_name} {host.version} (
                    {host.license_params.sku_type})
                  </Copiable>
                </tr>
                <tr>
                  <th>{_('hostBuildNumber')}</th>
                  <Copiable tagName='td'>{host.build}</Copiable>
                </tr>
                <tr>
                  <th>{_('hostIscsiName')}</th>
                  <Copiable tagName='td'>{host.iSCSI_name}</Copiable>
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
                <tr>
                  <th>{_('hostRemoteSyslog')}</th>
                  <td>
                    <Text
                      value={host.logging.syslog_destination || ''}
                      onChange={this._setRemoteSyslogHost}
                    />
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
                  <td>
                    {map(pgpus, pgpu => pcis[pgpu.pci].device_name).join(', ')}
                  </td>
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
                    {this._isHtEnabled()
                      ? _('stateEnabled')
                      : _('stateDisabled')}
                  </td>
                </tr>
                <tr>
                  <th>{_('hostManufacturerinfo')}</th>
                  <Copiable tagName='td'>
                    {host.bios_strings['system-manufacturer']} (
                    {host.bios_strings['system-product-name']})
                  </Copiable>
                </tr>
                <tr>
                  <th>{_('hostBiosinfo')}</th>
                  <td>
                    {host.bios_strings['bios-vendor']} (
                    {host.bios_strings['bios-version']})
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
                    <FormattedTime
                      value={host.license_expiry * 1000}
                      day='numeric'
                      month='long'
                      year='numeric'
                    />
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
                      <SelectFiles
                        type='file'
                        onChange={file => installSupplementalPack(host, file)}
                      />
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
          </Col>
        </Row>
      </Container>
    )
  }
}
