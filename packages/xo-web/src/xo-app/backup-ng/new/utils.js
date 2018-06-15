import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from '@julien-f/freactal'

export const FormGroup = props => <div {...props} className='form-group' />
export const Input = props => <input {...props} className='form-control' />
export const Ul = props => <ul {...props} className='list-group' />
export const Li = props => <li {...props} className='list-group-item' />

export const Number = [
  provideState({
    effects: {
      onChange: (_, { target: { value } }) => (state, props) => {
        if (value === '') {
          if (!props.optional) {
            return
          }

          props.onChange(undefined)
          return
        }
        props.onChange(+value)
      },
    },
  }),
  injectState,
  ({ effects, state, value, optional }) => (
    <Input
      type='number'
      onChange={effects.onChange}
      value={value === undefined ? undefined : String(value)}
      min='0'
    />
  ),
].reduceRight((value, decorator) => decorator(value))

Number.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
  optional: PropTypes.bool,
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
  component: PropTypes.node.isRequired,
  error: PropTypes.bool,
  message: PropTypes.node.isRequired,
}
