import Component from 'base-component'
import HostsPatchesTable from 'hosts-patches-table'
import React from 'react'
import Upgrade from 'xoa-upgrade'
import { connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType } from 'selectors'

// ===================================================================

@connectStore(() => {
  const getHosts = createGetObjectsOfType('host').filter(
    (_, props) => host => props.pool.id === host.$pool
  )

  return {
    hosts: getHosts
  }
})
export default class TabPatches extends Component {
  _getContainer = () => this.refs.container

  render () {
    return <Upgrade place='poolPatches' required={2}>
      <Container>
        <Row>
          <Col className='text-xs-right'>
            <div ref='container' />
          </Col>
        </Row>
        <Row>
          <Col>
            <HostsPatchesTable
              buttonsGroupContainer={this._getContainer}
              hosts={this.props.hosts}
              useTabButton
           />
          </Col>
        </Row>
      </Container>
    </Upgrade>
  }
}
