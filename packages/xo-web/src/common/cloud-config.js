import _ from 'intl'
import React from 'react'
import { map } from 'lodash'

import Icon from './icon'
import Tooltip from './tooltip'
import { alert } from './modal'

const AVAILABLE_TEMPLATE_VARS = {
  '{name}': 'templateNameInfo',
  '%': 'templateIndexInfo',
}

const showAvailableTemplateVars = () =>
  alert(
    _('availableTemplateVarsTitle'),
    <ul>
      {map(AVAILABLE_TEMPLATE_VARS, (value, key) => (
        <li key={key}>{_.keyValue(key, _(value))}</li>
      ))}
    </ul>
  )

export const AvailableTemplateVars = () => (
  <Tooltip content={_('availableTemplateVarsInfo')}>
    <a
      className='text-info'
      style={{ cursor: 'pointer' }}
      onClick={showAvailableTemplateVars}
    >
      <Icon icon='info' />
    </a>
  </Tooltip>
)

export const DEFAULT_CLOUD_CONFIG_TEMPLATE =
  '#cloud-config\n#hostname: {name}%\n#ssh_authorized_keys:\n#  - ssh-rsa <myKey>\n#packages:\n#  - htop\n'
