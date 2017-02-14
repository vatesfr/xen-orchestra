import React, { Component } from 'react'
import { Container, Row, Col } from 'grid'
import { connectStore } from 'utils'
import {
  keys,
  map
} from 'lodash'
import {
  createGetObjectsOfType
} from 'selectors'
import {
  getVolumeInfo
} from 'xo'

@connectStore(() => {
  return { allVMs: createGetObjectsOfType('VM'), allNetworks: createGetObjectsOfType('network') }
})
export default class TabXosan extends Component {
  constructor (props) {
    super(props)
    this.state = {
      peers: null,
      volumes: null
    }
  }

  componentDidMount () {
    getVolumeInfo(this.props.sr.id).then(info => {
      this.setState({ volumeInfo: info })
    })
  }

  render () {
    return <Container>
      {this.state.volumeInfo && map(keys(this.state.volumeInfo).sort(), key => key !== 'Bricks'
        ? <Row>
          <Col size={3}><strong>{key}</strong></Col>
          <Col size={4}>{this.state.volumeInfo[key]}</Col>
        </Row>
        : null
      )}
    </Container >
  }
}
