import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from 'reaclette'
import { omit } from 'lodash'

import decorate from './apply-decorators'
import Icon from './icon'
import { Select } from './form'

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
      options: (state, { maxCores, maxVcpus, value }) => {
        const options = [
          {
            label: _('vmChooseCoresPerSocket'),
            value: 0,
          },
        ]

        if (maxCores === undefined || maxVcpus === undefined) {
          return options
        }

        const ratio = maxVcpus / MAX_VM_SOCKETS

        let isSelectedValueInOptions = value === 0
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
            if (!isSelectedValueInOptions) {
              isSelectedValueInOptions = coresPerSocket === value
            }
          }
        }

        if (!isSelectedValueInOptions) {
          options.push({
            label: (
              <span>
                {_('vmCoresPerSocketInvalidValue', {
                  nCores: value,
                })}{' '}
                (
                <span className='text-danger'>
                  <Icon icon='error' />{' '}
                  {maxVcpus % value !== 0
                    ? _('vmCoresPerSocketNotDivisor')
                    : _('vmCoresPerSocketExceedLimit', {
                        limit: MAX_VM_SOCKETS,
                      })}
                </span>
                )
              </span>
            ),
            value,
          })
        }
        return options
      },
      selectProps: (_, props) => omit(props, Object.keys(PROP_TYPES)),
    },
  }),
  injectState,
  ({ state, value }) => (
    <Select
      options={state.options}
      required
      simpleValue
      value={value}
      {...state.selectProps}
    />
  ),
])

SelectCoresPerSocket.propTypes = PROP_TYPES

export { SelectCoresPerSocket as default }
