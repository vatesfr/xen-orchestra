import _ from 'intl'
import React from 'react'
import Icon from 'icon'
import Tooltip from 'tooltip'
import { alert } from 'modal'

export const LICENSE_WARNING_BODY = (
  <span>
    <a href='https://xcp-ng.com/pricing.html#xcpngvsxenserver' rel='noopener noreferrer' target='_blank'>
      {_('actionsRestricted')}
    </a>{' '}
    {_('counterRestrictionsOptions')}
    <ul>
      <li>
        <a href='https://github.com/xcp-ng/xcp/wiki/Upgrade-from-XenServer' rel='noopener noreferrer' target='_blank'>
          {_('counterRestrictionsOptionsXcp')}
        </a>
      </li>
      <li>{_('counterRestrictionsOptionsXsLicense')}</li>
    </ul>
  </span>
)

const showInfo = () => alert(_('licenseRestrictionsModalTitle'), LICENSE_WARNING_BODY)

const LicenseWarning = ({ iconSize = 'sm' }) => (
  <Tooltip content={_('licenseRestrictions')}>
    <a className='text-danger' style={{ cursor: 'pointer' }} onClick={showInfo}>
      <Icon icon='alarm' size={iconSize} />
    </a>
  </Tooltip>
)

export default LicenseWarning
