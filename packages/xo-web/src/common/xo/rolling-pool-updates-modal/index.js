import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import BaseComponent from 'base-component'
import Icon from 'icon'
import React from 'react'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'

import { subscribePlugins } from '../'

@addSubscriptions(() => ({
  plugins: subscribePlugins,
}))
@connectStore(
  {
    pools: createGetObjectsOfType('pool'),
  },
  { withRef: true }
)
export default class RollingPoolUpdateModal extends BaseComponent {
  render() {
    const pool = this.props.pools[this.props.pool]
    const loadBalancerPlugin =
      this.props.plugins !== undefined && this.props.plugins.find(plugin => plugin.name === 'load-balancer')

    return (
      <div>
        <p>{_('rollingPoolUpdateMessage')}</p>
        {pool.HA_enabled && (
          <p>
            <em className='text-warning'>
              <Icon icon='alarm' /> {_('rollingPoolUpdateHaWarning')}
            </em>
          </p>
        )}
        {loadBalancerPlugin !== undefined && loadBalancerPlugin.loaded && (
          <p>
            <em className='text-warning'>
              <Icon icon='alarm' /> {_('rollingPoolUpdateLoadBalancerWarning')}
            </em>
          </p>
        )}
      </div>
    )
  }
}
