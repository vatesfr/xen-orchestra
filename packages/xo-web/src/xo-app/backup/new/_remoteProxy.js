import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import Tooltip from 'tooltip'
import { generateId } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import keyBy from 'lodash/keyBy.js'
import { SelectProxy } from 'select-objects'
import { subscribeRemotes } from 'xo'

import { FormGroup } from '../utils'

export const RemoteProxy = decorate([
  provideState({
    effects: {
      onChange(_, proxy) {
        this.props.onChange(proxy !== null ? proxy.id : null)
      },
    },
    computed: {
      inputId: generateId,
    },
  }),
  injectState,
  ({ effects, value, onChange, state }) => (
    <FormGroup>
      <label htmlFor={state.inputId}>
        <strong>{_('proxy')}</strong>
      </label>
      <SelectProxy id={state.inputId} onChange={effects.onChange} value={value} />
    </FormGroup>
  ),
])
RemoteProxy.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

export const RemoteProxyWarning = decorate([
  addSubscriptions({
    remotes: cb =>
      subscribeRemotes(remotes => {
        cb(keyBy(remotes, 'id'))
      }),
  }),
  provideState({
    computed: {
      showWarning: (_, { id, proxyId, remotes = {} }) => {
        const remote = remotes[id]
        if (proxyId === null) {
          proxyId = undefined
        }
        return remote !== undefined && remote.proxy !== proxyId
      },
    },
  }),
  injectState,
  ({ state }) =>
    state.showWarning ? (
      <Tooltip content={_('remoteNotCompatibleWithSelectedProxy')}>
        <Icon icon='alarm' color='text-danger' />
      </Tooltip>
    ) : null,
])
