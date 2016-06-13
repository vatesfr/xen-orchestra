import Icon from 'icon'
import Link from 'react-router/lib/Link'
import React from 'react'
import { Card, CardHeader, CardBlock } from 'card'
import { getXoaPlan, propTypes } from 'utils'

export const Upgrade = propTypes({
  available: propTypes.number,
  place: propTypes.string
})(({
  available,
  place
}) => (
  <Card>
    <CardHeader>Upgrade needed</CardHeader>
    <CardBlock className='text-xs-center'>
      <p>This feature is available starting from {getXoaPlan(available)} Edition</p>
      <a href={`https://xen-orchestra.com/#!/pricing?pk_campaign=xoa_${getXoaPlan()}_upgrade&pk_kwd=${place}`} className='btn btn-primary btn-lg'>
        <Icon icon='plan-upgrade' /> Upgrade now!
      </a> Or&nbsp;
      <Link className='btn btn-success btn-lg' to={'/xoa-update'}>
        <Icon icon='plan-trial' /> Try it for free!
      </Link>
    </CardBlock>
  </Card>
))

export const ModalUpgrade = propTypes({
  available: propTypes.number,
  place: propTypes.string
})(({
  available,
  place
}) => (
  <Card>
    <CardHeader>Upgrade needed</CardHeader>
    <CardBlock className='text-xs-center'>
      <p>This feature is available starting from {getXoaPlan(available)} Edition</p>
      <a href={`https://xen-orchestra.com/#!/pricing?pk_campaign=xoa_${getXoaPlan()}_upgrade&pk_kwd=${place}`} className='btn btn-primary btn-lg'>
        <Icon icon='plan-upgrade' /> Upgrade now!
      </a> Or&nbsp;
      <Link className='btn btn-success btn-lg' to={'/xoa-update'}>
        <Icon icon='plan-trial' /> Try it for free!
      </Link>
    </CardBlock>
  </Card>
))
