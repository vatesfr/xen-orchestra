import React, { Component } from 'react'
import { Row, Col } from 'grid'
import {
  connectStore,
  propTypes
} from 'utils'

import ActionBar from 'action-bar'

@connectStore([
  'user',
  'status'
])
@propTypes({
  selectLang: propTypes.func.isRequired
})
export default class Navbar extends Component {
  render () {
    const {
      user,
      status
    } = this.props
    return <Row className='xo-navbar'>
      <Col size={2}>
        <h1 style={{marginLeft: '5px'}}>Xen-Orchestra</h1>
      </Col>
      <Col size={1} offset={7}>
        <ActionBar style={{margin: '3px'}} actions={[
          {
            label: 'enLang',
            handler: () => this.props.selectLang('en')
          },
          {
            label: 'frLang',
            handler: () => this.props.selectLang('fr')
          }
        ]} />
      </Col>
      <Col size={2}>
        {status[0].toUpperCase() + status.slice(1)}{user && ` as ${user.email}`}
      </Col>
    </Row>
  }
}
