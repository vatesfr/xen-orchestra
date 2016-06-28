import Link from 'react-router/lib/Link'
import React from 'react'

import _ from './intl'
import Icon from './icon'
import propTypes from './prop-types'
import { Card, CardHeader, CardBlock } from './card'
import { getXoaPlan } from './utils'

const Upgrade = propTypes({
  available: propTypes.number.isRequired,
  place: propTypes.string.isRequired
})(({
  available,
  place
}) => (
  <Card>
    <CardHeader>{_('upgradeNeeded')}</CardHeader>
    <CardBlock className='text-xs-center'>
      <p>{_('availableIn', {plan: getXoaPlan(available)})}</p>
      <p>
        <a href={`https://xen-orchestra.com/#!/pricing?pk_campaign=xoa_${getXoaPlan()}_upgrade&pk_kwd=${place}`} className='btn btn-primary btn-lg'>
          <Icon icon='plan-upgrade' /> {_('upgradeNow')}
        </a> {_('or')}&nbsp;
        <Link className='btn btn-success btn-lg' to={'/xoa-update'}>
          <Icon icon='plan-trial' /> {_('tryIt')}
        </Link>
      </p>
    </CardBlock>
  </Card>
))

export { Upgrade as default }
