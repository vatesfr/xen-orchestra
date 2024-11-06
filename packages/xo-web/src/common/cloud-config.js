import _ from 'intl'
import React from 'react'
import map from 'lodash/map.js'

import Icon from './icon'
import Tooltip from './tooltip'
import { alert } from './modal'

const AVAILABLE_TEMPLATE_VARS = {
  '{name}': 'templateNameInfo',
  '{index}': 'templateIndexInfo',
}

const showAvailableTemplateVars = () =>
  alert(
    _('availableTemplateVarsTitle'),
    <div>
      <ul>
        {map(AVAILABLE_TEMPLATE_VARS, (value, key) => (
          <li key={key}>{_.keyValue(key, _(value))}</li>
        ))}
      </ul>
      <div className='text-info'>
        <Icon icon='info' /> {_('templateEscape')}
      </div>
    </div>
  )

const showNetworkConfigInfo = () =>
  alert(
    _('newVmNetworkConfigLabel'),
    <div>
      <p>
        {_('newVmNetworkConfigInfo', {
          noCloudDatasourceLink: (
            <a
              href='https://cloudinit.readthedocs.io/en/latest/reference/datasources/nocloud.html'
              rel='noopener noreferrer'
              target='_blank'
            >
              {_('newVmNoCloudDatasource')}
            </a>
          ),
        })}
      </p>
      <p>
        {_('newVmNetworkConfigDocLink', {
          networkConfigDocLink: (
            <a
              href='https://cloudinit.readthedocs.io/en/latest/reference/network-config-format-v1.html#network-config-v1'
              rel='noopener noreferrer'
              target='_blank'
            >
              {_('newVmNetworkConfigDoc')}
            </a>
          ),
        })}
      </p>
    </div>
  )

export const AvailableTemplateVars = () => (
  <Tooltip content={_('availableTemplateVarsInfo')}>
    <a className='text-info' style={{ cursor: 'pointer' }} onClick={showAvailableTemplateVars}>
      <Icon icon='info' />
    </a>
  </Tooltip>
)

export const NetworkConfigInfo = () => (
  <Tooltip content={_('newVmNetworkConfigTooltip')}>
    <a className='text-info' style={{ cursor: 'pointer' }} onClick={showNetworkConfigInfo}>
      <Icon icon='info' />
    </a>
  </Tooltip>
)

export const DEFAULT_CLOUD_CONFIG_TEMPLATE =
  '#cloud-config\n#hostname: {name}{index}\n#ssh_authorized_keys:\n#  - ssh-rsa <myKey>\n#packages:\n#  - htop\n'

// SOURCE: https://cloudinit.readthedocs.io/en/latest/topics/network-config-format-v1.html
export const DEFAULT_NETWORK_CONFIG_TEMPLATE = `#network:
#  version: 1
#  config:
#  - type: physical
#    name: eth0
#    subnets:
#      - type: dhcp`
