import _ from 'intl'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import Tooltip from 'tooltip'
import { get as getProperty } from 'lodash'
import { resolveId, resolveIds } from 'utils'

export const FormGroup = props => <div {...props} className='form-group' />
export const Input = props => <input {...props} className='form-control' />
export const Ul = props => <ul {...props} className='list-group' />
export const Li = props => <li {...props} className='list-group-item' />

export const destructPattern = pattern => pattern.id.__or || [pattern.id]

export const constructPattern = values =>
  values.length === 1
    ? {
        id: resolveId(values[0]),
      }
    : {
        id: {
          __or: resolveIds(values),
        },
      }

export const FormFeedback = ({
  component: Component,
  error,
  message,
  ...props
}) => (
  <div>
    <Component
      {...props}
      style={
        error === undefined
          ? undefined
          : {
              borderColor: error ? 'red' : 'green',
              ...props.style,
            }
      }
    />
    {error && (
      <span className='text-danger'>
        <Icon icon='alarm' /> {message}
      </span>
    )}
  </div>
)

FormFeedback.propTypes = {
  component: PropTypes.func.isRequired,
  error: PropTypes.bool,
  message: PropTypes.node.isRequired,
}

const SR_BACKEND_FAILURE_LINK =
  'https://xen-orchestra.com/docs/backup_troubleshooting.html#srbackendfailure44-insufficient-space'

export const ThinProvisionedTip = ({ label }) => (
  <Tooltip content={_(label)}>
    <a
      className='text-info'
      href={SR_BACKEND_FAILURE_LINK}
      rel='noopener noreferrer'
      target='_blank'
    >
      <Icon icon='info' />
    </a>
  </Tooltip>
)

export const getValue = (name, extractFromProps, defaultValue) => (
  state,
  props
) =>
  defined(
    state[name],
    typeof extractFromProps === 'function'
      ? () => extractFromProps(props, state)
      : getProperty(props, extractFromProps),
    defaultValue
  )
