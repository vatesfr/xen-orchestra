import Component from 'base-component'
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
    getVolumeInfo(this.props.sr.id).then(info => {
      this.setState({ volumeInfo: info })
    })
  }

  render () {
    return <Container>
      {this.state.volumeInfo && map(keys(this.state.volumeInfo).sort(), key => key !== 'Bricks'
        ? <Row key={key}>
          <Col size={3}><strong>{key}</strong></Col>
          <Col size={4}>{this.state.volumeInfo[key]}</Col>
        </Row>
        : null
      )}
    </Container >
  }
}
