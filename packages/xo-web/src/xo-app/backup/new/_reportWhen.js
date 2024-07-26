import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import Link from 'link'
import PropTypes from 'prop-types'
import React from 'react'
import Select from 'form/select'
import Tooltip from 'tooltip'
import { generateId } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'

import { FormGroup } from './../utils'

export const REPORT_WHEN_LABELS = {
  always: 'reportWhenAlways',
  failure: 'reportWhenFailure',
  never: 'reportWhenNever',
  'skipped and failure': 'reportWhenSkippedAndFailure'
}

const REPORT_WHEN_FILTER_OPTIONS = Object.entries(REPORT_WHEN_LABELS).map(([value, label]) => ({ label, value }))

const getOptionRenderer = ({ label }) => <span>{_(label)}</span>

const ReportWhen = decorate([
  provideState({
    computed: {
      idInput: generateId,
    },
  }),
  injectState,
  ({ state, onChange, value, ...props }) => (
    <FormGroup>
      <label htmlFor={state.idInput}>
        <strong>{_('reportWhen')}</strong>
      </label>{' '}
      <Tooltip content={_('pluginsWarning')}>
        <Link className='btn btn-primary btn-sm' target='_blank' to='/settings/plugins'>
          <Icon icon='menu-settings-plugins' /> <strong>{_('pluginsSettings')}</strong>
        </Link>
      </Tooltip>
      <Select
        id={state.idInput}
        onChange={onChange}
        optionRenderer={getOptionRenderer}
        options={REPORT_WHEN_FILTER_OPTIONS}
        value={value}
        {...props}
      />
    </FormGroup>
  ),
])

ReportWhen.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

export { ReportWhen as default }
