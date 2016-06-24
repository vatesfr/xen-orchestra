import _ from 'intl'
import ActionButton from 'action-button'
import Icon from 'icon'
import React from 'react'
import { Link } from 'react-router'

const COMMON_PROPS = {
  size: 'large',
  style: {
    marginBottom: '1em',
    marginLeft: '1em'
  }
}
const TabButton = ({
  labelId,
  ...props
}) => (
  <ActionButton
    {...props}
    {...COMMON_PROPS}
  ><span className='hidden-md-down'>{_(labelId)}</span></ActionButton>
)
export { TabButton as default }

export const TabButtonLink = ({
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
