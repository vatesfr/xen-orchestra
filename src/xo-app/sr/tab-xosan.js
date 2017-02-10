import map from 'lodash/map'
import React, { Component } from 'react'
import { Container } from 'grid'
import { connectStore } from 'utils'
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
      <dl>
        {this.state.volumeInfo && map(Object.keys(this.state.volumeInfo).sort(), key => key !== 'Bricks' && (
          <div>
            <dt>{key}:</dt>
            <dd>{this.state.volumeInfo[key]}</dd>
          </div>))}
      </dl>
    </Container >
  }
}
