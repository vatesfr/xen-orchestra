import React from 'react'
import { Col, Row } from 'grid'
import { propTypes } from 'utils'

const FormGroup = propTypes({
  label: propTypes.any.isRequired,
  children: propTypes.any.isRequired
})(({ label, children }) => (
  <Row className='form-group'>
    <label className='col-sm-2 form-control-label'>{label}</label>
    <Col mediumSize={10}>
      {children}
    </Col>
  </Row>
))
export { FormGroup as default }
