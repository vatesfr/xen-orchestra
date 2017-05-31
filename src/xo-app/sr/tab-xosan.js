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
    getVolumeInfo(this.props.sr.id).then(data => {
      this.setState({ volumeInfo: data })
    })
  }

  render () {
    return this.state.volumeInfo ? (<Container>
      {this.state.volumeInfo && map(keys(this.state.volumeInfo.info).sort(), key => key !== 'Bricks'
        ? <Row key={key}>
          <Col size={3}><strong>{key}</strong></Col>
            <Col size={4}>{this.state.volumeInfo.info[key]}</Col>
        </Row>
        : null
      )}
    </Container >) : (<Container/>)
  }
}
