import _ from 'intl'
import React from 'react'
import defined, { get } from '@xen-orchestra/defined'
import { injectState, provideState } from 'reaclette'

import decorate from './apply-decorators'
import Icon from './icon'
import renderXoItem from './render-xo-item'
import { connectStore } from './utils'
import { createGetObject } from './selectors'
import { editVm, editPool, isSrWritable } from './xo'
import { XoSelect } from './editable'

export const SelectSuspendSr = decorate([
  connectStore({
    suspendSr: createGetObject((_, { pool, vm }) => (vm || pool).suspendSr),
  }),
  provideState({
    effects: {
      onChange(_, value) {
        const { isVm } = this.state
        const method = isVm ? editVm : editPool
        method(isVm ? this.props.vm : this.props.pool, {
          suspendSr: defined(
            get(() => value.id),
            null
          ),
        })
      },
    },
    computed: {
      isVm: (state, props) => props.vm !== undefined,
      predicate: (state, props) => sr =>
        isSrWritable(sr) && (state.isVm ? props.vm.$pool === sr.$pool : props.pool.id === sr.$pool),
    },
  }),
  injectState,
  ({ effects: { onChange }, state: { predicate }, suspendSr }) => (
    <span>
      <XoSelect onChange={onChange} predicate={predicate} value={suspendSr} xoType='SR'>
        {suspendSr !== undefined ? renderXoItem(suspendSr) : _('noValue')}
      </XoSelect>{' '}
      {suspendSr !== undefined && (
        <a role='button' onClick={onChange}>
          <Icon icon='remove' />
        </a>
      )}
    </span>
  ),
])
