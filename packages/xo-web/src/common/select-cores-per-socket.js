import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from 'reaclette'
import { omit } from 'lodash'

import decorate from './apply-decorators'
import Icon from './icon'
import { Select } from './form'

const DEFAULT_OPTION = {
  label: _('vmChooseCoresPerSocket'),
  value: 0,
}

const PROP_TYPES = {
  maxCores: PropTypes.number,
  maxVcpus: PropTypes.number,
  value: PropTypes.number.isRequired,
}

// https://github.com/xcp-ng/xenadmin/blob/0160cd0119fae3b871eef656c23e2b76fcc04cb5/XenModel/XenAPI-Extensions/VM.cs#L62
const MAX_VM_SOCKETS = 16

// This algorithm was inspired from: https://github.com/xcp-ng/xenadmin/blob/master/XenAdmin/Controls/ComboBoxes/CPUTopologyComboBox.cs#L116
const SelectCoresPerSocket = decorate([
  provideState({
    computed: {
      isValidValue: (state, { maxCores, maxVcpus, value }) =>
        value === DEFAULT_OPTION.value ||
        (maxVcpus % value === 0 && !state.valueExceedsLimits),
      valueExceedsLimits: ({ maxCores, maxVcpus, value }) =>
        value > maxCores || maxVcpus / value > MAX_VM_SOCKETS,
      options: ({ isValidValue }, { maxCores, maxVcpus, value }) => {
        const options = [DEFAULT_OPTION]

        if (maxCores === undefined || maxVcpus === undefined) {
          return options
        }

        const ratio = maxVcpus / MAX_VM_SOCKETS

        for (
          let coresPerSocket = maxCores;
          coresPerSocket >= ratio;
          coresPerSocket--
        ) {
          if (maxVcpus % coresPerSocket === 0) {
            options.push({
              label: _('vmCoresPerSocket', {
                nSockets: maxVcpus / coresPerSocket,
                nCores: coresPerSocket,
              }),
              value: coresPerSocket,
            })
          }
        }

        if (!isValidValue) {
          options.push({
            label: _('vmCoresPerSocketInvalidValue', {
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
    <div>
      <Select
        options={state.options}
        required
        simpleValue
        value={value}
        {...state.selectProps}
      />
      {!state.isValidValue && (
        <span className='text-danger'>
          <Icon icon='error' />{' '}
          {state.valueExceedsLimits
            ? _('vmCoresPerSocketExceedsLimit', {
                maxSockets: MAX_VM_SOCKETS,
                maxCores,
              })
            : _('vmCoresPerSocketNotDivisor')}
        </span>
      )}
    </div>
  ),
])

SelectCoresPerSocket.propTypes = PROP_TYPES

export { SelectCoresPerSocket as default }
