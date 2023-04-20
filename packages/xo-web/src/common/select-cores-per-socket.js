import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from 'reaclette'
import omit from 'lodash/omit.js'

import decorate from './apply-decorators'
import Icon from './icon'
import Tooltip from './tooltip'
import { Select } from './form'

const PROP_TYPES = {
  maxCores: PropTypes.number,
  maxVcpus: PropTypes.number,
  value: PropTypes.number,
}

const SELECT_STYLE = {
  display: 'inline-block',
  fontSize: '1rem',
  width: '20em',
}

const LINE_ITEM_STYLE = {
  alignItems: 'center',
  display: 'flex',
}

// https://github.com/xcp-ng/xenadmin/blob/0160cd0119fae3b871eef656c23e2b76fcc04cb5/XenModel/XenAPI-Extensions/VM.cs#L62
const MAX_VM_SOCKETS = 16

// This algorithm was inspired from: https://github.com/xcp-ng/xenadmin/blob/master/XenAdmin/Controls/ComboBoxes/CPUTopologyComboBox.cs#L116
const SelectCoresPerSocket = decorate([
  provideState({
    computed: {
      isValidValue: (state, { maxVcpus, value }) =>
        value == null || (maxVcpus % value === 0 && !state.valueExceedsCoresLimit && !state.valueExceedsSocketsLimit),
      valueExceedsCoresLimit: (state, { maxCores, value }) => value > maxCores,
      valueExceedsSocketsLimit: (state, { maxCores, maxVcpus, value }) => maxVcpus / value > MAX_VM_SOCKETS,
      options: ({ isValidValue }, { maxCores, maxVcpus, value }) => {
        const options = []

        if (maxCores === undefined || maxVcpus === undefined) {
          return options
        }

        const minCores = maxVcpus / MAX_VM_SOCKETS

        // cores per socket must be a divisor of the max vCPUs and must not exceed the cores and sockets limit
        // e.g: with maxCores = 4, maxSockets = 16 and maxVCPUS = 6
        // 2 cores per socket is a valid value and 4 cores per socket isn't a valid value
        for (let coresPerSocket = maxCores; coresPerSocket >= minCores; coresPerSocket--) {
          if (maxVcpus % coresPerSocket === 0) {
            options.push({
              label: _('vmSocketsWithCoresPerSocket', {
                nSockets: maxVcpus / coresPerSocket,
                nCores: coresPerSocket,
              }),
              value: coresPerSocket,
            })
          }
        }

        if (!isValidValue) {
          options.push({
            label: _('vmCoresPerSocket', {
              nCores: value,
            }),
            value,
          })
        }
        return options
      },
      selectProps: (_, props) => omit(props, Object.keys(PROP_TYPES)),
    },
  }),
  injectState,
  ({ maxCores, state, value }) => (
    <div style={LINE_ITEM_STYLE}>
      <span style={SELECT_STYLE}>
        <Select
          options={state.options}
          placeholder={_('vmChooseCoresPerSocket')}
          simpleValue
          value={value}
          {...state.selectProps}
        />
      </span>
      &nbsp;
      {!state.isValidValue && (
        <Tooltip
          content={
            state.valueExceedsCoresLimit
              ? _('vmCoresPerSocketExceedsCoresLimit', { maxCores })
              : state.valueExceedsSocketsLimit
              ? _('vmCoresPerSocketExceedsSocketsLimit', {
                  maxSockets: MAX_VM_SOCKETS,
                })
              : _('vmCoresPerSocketNotDivisor')
          }
        >
          <Icon icon='error' size='lg' />
        </Tooltip>
      )}
    </div>
  ),
])

SelectCoresPerSocket.propTypes = PROP_TYPES

export { SelectCoresPerSocket as default }
