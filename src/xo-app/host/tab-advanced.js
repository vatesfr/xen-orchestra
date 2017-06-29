import _ from 'intl'
import Copiable from 'copiable'
import React from 'react'
import TabButton from 'tab-button'
import SelectFiles from 'select-files'
import Upgrade from 'xoa-upgrade'
import { Toggle } from 'form'
import { enableHost, detachHost, disableHost, forgetHost, restartHost, installSupplementalPack } from 'xo'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Container, Row, Col } from 'grid'
import {
  map
} from 'lodash'

const ALLOW_INSTALL_SUPP_PACK = process.env.XOA_PLAN > 1

const forceReboot = host => restartHost(host, true)

const formatPack = ({ name, author, description, version }) => <tr>
  <th>{_('supplementalPackTitle', { author, name })}</th>
  <td>{description}</td>
  <td>{version}</td>
</tr>

export default ({
  host
}) => <Container>
  <Row>
    <Col className='text-xs-right'>
      {host.power_state === 'Running' &&
        <TabButton
          btnStyle='warning'
          handler={forceReboot}
          handlerParam={host}
          icon='host-force-reboot'
          labelId='forceRebootHostLabel'
        />
      }
      {host.enabled
        ? <TabButton
          btnStyle='warning'
          handler={disableHost}
          handlerParam={host}
          icon='host-disable'
          labelId='disableHostLabel'
        />
        : <TabButton
          btnStyle='success'
          handler={enableHost}
          handlerParam={host}
          icon='host-enable'
          labelId='enableHostLabel'
        />
      }
      <TabButton
        btnStyle='danger'
        handler={detachHost}
        handlerParam={host}
        icon='host-eject'
        labelId='detachHost'
      />
      {host.power_state !== 'Running' &&
        <TabButton
          btnStyle='danger'
          handler={forgetHost}
          handlerParam={host}
          icon='host-forget'
          labelId='forgetHost'
        />
      }
    </Col>
  </Row>
  <Row>
    <Col>
      <h3>{_('xenSettingsLabel')}</h3>
      <table className='table'>
        <tbody>
          <tr>
            <th>{_('uuid')}</th>
            <Copiable tagName='td'>
              {host.uuid}
            </Copiable>
          </tr>
          <tr>
            <th>{_('hostAddress')}</th>
            <Copiable tagName='td'>
              {host.address}
            </Copiable>
          </tr>
          <tr>
            <th>{_('hostStatus')}</th>
            <td>
              {host.enabled
                ? _('hostStatusEnabled')
                : _('hostStatusDisabled')
              }
            </td>
          </tr>
          <tr>
            <th>{_('hostPowerOnMode')}</th>
            <td>
              <Toggle value={host.powerOnMode} disabled />
            </td>
          </tr>
          <tr>
            <th>{_('hostStartedSince')}</th>
            <td>{_('started', { ago: <FormattedRelative value={host.startTime * 1000} /> })}</td>
          </tr>
          <tr>
            <th>{_('hostStackStartedSince')}</th>
            <td>{_('started', { ago: <FormattedRelative value={host.agentStartTime * 1000} /> })}</td>
          </tr>
          <tr>
            <th>{_('hostXenServerVersion')}</th>
            <Copiable tagName='td'>
              {host.license_params.sku_marketing_name} {host.version} ({host.license_params.sku_type})
            </Copiable>
          </tr>
          <tr>
            <th>{_('hostBuildNumber')}</th>
            <Copiable tagName='td'>
              {host.build}
            </Copiable>
          </tr>
          <tr>
            <th>{_('hostIscsiName')}</th>
            <Copiable tagName='td'>
              {host.iSCSI_name}
            </Copiable>
          </tr>
        </tbody>
      </table>
      <br />
      <h3>{_('hardwareHostSettingsLabel')}</h3>
      <table className='table'>
        <tbody>
          <tr>
            <th>{_('hostCpusModel')}</th>
            <Copiable tagName='td'>
              {host.CPUs.modelname}
            </Copiable>
          </tr>
          <tr>
            <th>{_('hostCpusNumber')}</th>
            <td>{host.cpus.cores} ({host.cpus.sockets})</td>
          </tr>
          <tr>
            <th>{_('hostManufacturerinfo')}</th>
            <Copiable tagName='td'>
              {host.bios_strings['system-manufacturer']} ({host.bios_strings['system-product-name']})
            </Copiable>
          </tr>
          <tr>
            <th>{_('hostBiosinfo')}</th>
            <td>{host.bios_strings['bios-vendor']} ({host.bios_strings['bios-version']})</td>
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
              <FormattedTime value={host.license_expiry * 1000} day='numeric' month='long' year='numeric' /><br />
            </td>
          </tr>
        </tbody>
      </table>
      <h3>{_('supplementalPacks')}</h3>
      <table className='table'>
        <tbody>
          {map(host.supplementalPacks, formatPack)}
          {ALLOW_INSTALL_SUPP_PACK && <tr>
            <th>{_('supplementalPackNew')}</th>
            <td>
              <SelectFiles
                type='file'
                onChange={file => installSupplementalPack(host, file)}
              />
            </td>
          </tr>}
        </tbody>
      </table>
      {!ALLOW_INSTALL_SUPP_PACK && [
        <h3>{_('supplementalPackNew')}</h3>,
        <Container><Upgrade place='supplementalPacks' available={2} /></Container>
      ]}
    </Col>
  </Row>
</Container>
