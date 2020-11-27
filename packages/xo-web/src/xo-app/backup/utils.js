import classNames from 'classnames'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import { resolveId, resolveIds } from 'utils'

export const FormGroup = props => <div {...props} className='form-group' />
export const Input = props => <input {...props} className='form-control' />
export const Ul = props => <ul {...props} className={classNames(props.className, 'list-group')} />
export const Li = props => <li {...props} className='list-group-item' />

export const destructPattern = pattern => pattern && (pattern.id.__or || [pattern.id])
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

export const FormFeedback = ({ component: Component, error, message, ...props }) => (
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

export const canDeltaBackup = version => {
  if (version === undefined) {
    return false
  }
  const [major, minor] = version.split('.')
  return +major > 6 || (+major === 6 && +minor >= 5)
}
