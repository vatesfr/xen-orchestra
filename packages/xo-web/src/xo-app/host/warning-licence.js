import _ from 'intl'
import React from 'react'
import Icon from 'icon'
import { alert } from 'modal'

const showInfo = () =>
  alert(
    _('warningSuggestXcpngTitle'),
    <span>
      <a
        href='https://xcp-ng.com/pricing.html#xcpngvsxenserver'
        target='_blank'
      >
        Some actions will be restricted.
      </a>{' '}
      You can:
      <ul>
        <li>
          <a
            href='https://github.com/xcp-ng/xcp/wiki/Upgrade-from-XenServer'
            target='_blank'
          >
            upgrade to XCP-ng{' '}
          </a>
          for free to get rid of these restrictions
        </li>
        <li>or get a commercial Citrix license</li>
      </ul>
    </span>
  )

const showWarningLicence = () => (
  <a className='text-danger' style={{ cursor: 'pointer' }} onClick={showInfo}>
    <Icon icon='alarm' size='lg' />
  </a>
)

export default showWarningLicence
