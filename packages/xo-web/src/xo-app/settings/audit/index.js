import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import { subscribePlugins } from 'xo'

import Logs from '../../logs/audit'

const LINK_TO_PLUGINS = '/settings/plugins'

export default decorate([
  addSubscriptions({
    plugin: cb =>
      subscribePlugins(plugins => {
        cb(plugins && (plugins.find(({ id }) => id === 'audit') || 'NONE'))
      }),
  }),
  ({ plugin }) => {
    if (plugin === undefined) {
      return <img src='assets/loading.svg' alt='loading' />
    }

    if (plugin === 'NONE' || !plugin.loaded) {
      return (
        <Link to={LINK_TO_PLUGINS} target='_blank'>
          <div className='alert alert-info text-xs-center'>
            {_('auditPluginNeededMessage')}
          </div>
        </Link>
      )
    }

    return (
      <div>
        {!plugin.configuration.enabled && (
          <Link className='text-info' to={LINK_TO_PLUGINS} target='_blank'>
            <Icon icon='info' /> {_('auditPluginDisabledMessage')}
          </Link>
        )}
        <Logs />
      </div>
    )
  },
])
