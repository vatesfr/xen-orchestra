import _ from 'intl'
import BaseComponent from 'base-component'
import Icon from 'icon'
import React from 'react'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'

@connectStore(
  {
    pools: createGetObjectsOfType('pool'),
  },
  { withRef: true }
)
export default class RollingPoolUpdateModal extends BaseComponent {
  render() {
    const pool = this.props.pools[this.props.pool]

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
      </div>
    )
  }
}
