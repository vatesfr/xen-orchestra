import React from 'react'

import _ from './intl'
import Icon from './icon'
import Link from './link'
import propTypes from './prop-types'
import { Card, CardHeader, CardBlock } from './card'
import { connectStore, getXoaPlan } from './utils'
import { isAdmin } from 'selectors'

const Upgrade = propTypes({
  available: propTypes.number,
  place: propTypes.string.isRequired,
  required: propTypes.number
})(connectStore({
  isAdmin
}))(({
  available,
  children,
  isAdmin,
  place,
  required = available
}) => process.env.XOA_PLAN < required
  ? <Card>
    <CardHeader>{_('upgradeNeeded')}</CardHeader>
    {isAdmin
      ? <CardBlock className='text-xs-center'>
        <p>{_('availableIn', {plan: getXoaPlan(required)})}</p>
        <p>
          <a href={`https://xen-orchestra.com/#!/pricing?pk_campaign=xoa_${getXoaPlan()}_upgrade&pk_kwd=${place}`} className='btn btn-primary btn-lg'>
            <Icon icon='plan-upgrade' /> {_('upgradeNow')}
          </a> {_('or')}&nbsp;
          <Link className='btn btn-success btn-lg' to={'/xoa-update'}>
            <Icon icon='plan-trial' /> {_('tryIt')}
          </Link>
        </p>
      </CardBlock>
      : <CardBlock className='text-xs-center'>
        <p>{_('notAvailable')}</p>
      </CardBlock>
    }
  </Card>
  : children
)

export { Upgrade as default }
