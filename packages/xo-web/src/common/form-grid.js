import React from 'react'
import PropTypes from 'prop-types'

import * as Grid from './grid'

export const LabelCol = ({ children }) => <label className='col-md-2 form-control-label'>{children}</label>

LabelCol.propTypes = {
  children: PropTypes.any.isRequired,
}

export const InputCol = ({ children }) => <Grid.Col mediumSize={10}>{children}</Grid.Col>

InputCol.propTypes = {
  children: PropTypes.any.isRequired,
}

export const Row = ({ children }) => <Grid.Row className='form-group'>{children}</Grid.Row>

Row.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element).isRequired,
}
