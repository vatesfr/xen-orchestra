import React from 'react'

export const FormGroup = props => <div {...props} className='form-group' />
export const Input = props => <input {...props} className='form-control' />
export const Ul = props => <ul {...props} className='list-group' />
export const Li = props => <li {...props} className='list-group-item' />

export const getRandomId = () =>
  Math.random()
    .toString(36)
    .slice(2)
