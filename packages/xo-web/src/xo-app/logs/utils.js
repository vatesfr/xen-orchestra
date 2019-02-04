import React from 'react'
import { FormattedDate } from 'react-intl'

export const STATUS_LABELS = {
  failure: {
    className: 'danger',
    label: 'jobFailed',
  },
  skipped: {
    className: 'info',
    label: 'jobSkipped',
  },
  success: {
    className: 'success',
    label: 'jobSuccess',
  },
  pending: {
    className: 'warning',
    label: 'jobStarted',
  },
  interrupted: {
    className: 'danger',
    label: 'jobInterrupted',
  },
}

export const LOG_FILTERS = {
  jobFailed: 'status: failure',
  jobInterrupted: 'status: interrupted',
  jobSkipped: 'status: skipped',
  jobStarted: 'status: pending',
  jobSuccess: 'status: success',
}

export const LogDate = ({ time }) => (
  <FormattedDate
    value={new Date(time)}
    month='short'
    day='numeric'
    year='numeric'
    hour='2-digit'
    minute='2-digit'
    second='2-digit'
  />
)
