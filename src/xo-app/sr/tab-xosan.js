import Component from 'base-component'
import Link from 'link'
import React from 'react'
import { Container, Row, Col } from 'grid'
import {
  keys,
  map
} from 'lodash'
import {
  getVolumeInfo
} from 'xo'

export default class TabXosan extends Component {
  componentDidMount () {
    getVolumeInfo(this.props.sr.id).then(data => {
      this.setState({ volumeInfo: data })
    })
  }

  render () {
    return this.state.volumeInfo ? (<Container>
      <h2>Bricks</h2>
      {this.state.volumeInfo && map(this.state.volumeInfo.info['Bricks'], brick =>
        <Row key={brick.ip}>
          <Col size={2}><strong>{brick.ip}</strong></Col>
          <Col size={3}><Link to={`/vms/${brick.vmId}`} title={brick.brickLabel}>{brick.vmLabel}</Link></Col>
        </Row>
      )}
      <h2>Volume</h2>
      {this.state.volumeInfo && map(keys(this.state.volumeInfo.info), key => key !== 'Bricks'
        ? <Row key={key}>
          <Col size={3}><strong>{key}</strong></Col>
          <Col size={4}>{this.state.volumeInfo.info[key]}</Col>
        </Row>
        : null
      )}
    </Container >) : (<Container />)
  }
}
