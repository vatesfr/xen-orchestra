import _ from 'intl'
import Icon from 'icon'
import React from 'react'
import { Link } from 'react-router'

const COMMON_PROPS = {
  style: {
    marginBottom: '1em',
    marginLeft: '1em'
  }
}
const TabButtonLink = ({
  labelId,
  icon,
  ...props
}) => (
  <Link
    {...props}
    {...COMMON_PROPS}
    className='btn btn-lg btn-primary'
  >
    <span className='hidden-md-down'>
      {icon && (
        <span>
          <Icon icon={icon} />
          {' '}
        </span>
      )}
      {_(labelId)}
    </span>
  </Link>
)
export { TabButtonLink as default }
