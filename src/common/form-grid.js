import React from 'react'

import * as Grid from './grid'
import propTypes from './prop-types-decorator'

export const LabelCol = propTypes({
  children: propTypes.any.isRequired
})(({ children }) => (
  <label className='col-md-2 form-control-label'>{children}</label>
))

export const InputCol = propTypes({
  children: propTypes.any.isRequired
})(({ children }) => <Grid.Col mediumSize={10}>{children}</Grid.Col>)

export const Row = propTypes({
  children: propTypes.arrayOf(propTypes.element).isRequired
})(({ children }) => <Grid.Row className='form-group'>{children}</Grid.Row>)
