import Component from 'base-component'
import Link from 'link'
import React from 'react'
import ActionButton from 'action-button'
import { Container, Row, Col } from 'grid'
import { SelectSr } from 'select-objects'
import {
  map
} from 'lodash'
import {
  createSelector
} from 'selectors'
import {
  getVolumeInfo,
  replaceXosanBrick
} from 'xo'

export default class TabXosan extends Component {
  componentDidMount () {
    getVolumeInfo(this.props.sr.id).then(data => {
      this.setState({ volumeInfo: data })
    })
  }
  _replaceBrick = (brick) => {
    replaceXosanBrick(this.props.sr.id, brick, this.state.sr.id)
  }
  _getSrPredicate = createSelector(
    () => this.props.sr.pool, pool => sr => sr.SR_type === 'lvm'
  )

  render () {
    const {sr} = this.state
    return this.state.volumeInfo ? (<Container>
      {this.state.volumeInfo && map(this.state.volumeInfo['bricks'], brick =>
        <div>
          <h3>Brick {brick.info.name}</h3>
          <div style={{ marginLeft: '15px' }}>
            <Row>
              <Col size={2}>Brick UUID: </Col><Col size={4}>{brick.uuid}</Col>
            </Row>
            <Row>
              <Col size={2}>Virtual Machine: </Col><Col size={4}><Link to={`/vms/${brick.vmId}`} title={brick.info.name}>{brick.vmLabel}</Link></Col>
            </Row>
            <Row>
              <Col size={2}>Status: </Col><Col size={4}>{brick.heal.status}</Col>
              <Col size={3}>
                <SelectSr predicate={this._getSrPredicate()} onChange={this.linkState('sr')} value={sr} />
              </Col>
              <Col size={3}>
                <ActionButton
                  btnStyle='success'
                  icon='refresh'
                  handler={this._replaceBrick}
                  handlerParam={brick.info.name}
                >Replace</ActionButton>
              </Col>
            </Row>
            <Row>
              <Col size={2}>Arbiter: </Col><Col size={4}>{brick.info.isArbiter === '1' ? 'True' : 'False' }</Col>
            </Row>
            {brick['status'].length !== 0 && <table style={{border: 'solid black 1px'}}>
              <thead>
                <tr style={{border: 'solid black 1px'}}>
                  <th style={{border: 'solid black 1px'}}>Job</th>
                  <th style={{border: 'solid black 1px'}}>Path</th>
                  <th style={{border: 'solid black 1px'}}>Status</th>
                  <th style={{border: 'solid black 1px'}}>PID</th>
                  <th style={{border: 'solid black 1px'}}>Port</th>
                </tr>
              </thead>
              {map(brick['status'], job => <tr style={{border: 'solid black 1px'}}>
                <td style={{border: 'solid black 1px'}}>{job.hostname}</td>
                <td style={{border: 'solid black 1px'}}>{job.path}</td>
                <td style={{border: 'solid black 1px'}}>{job.status}</td>
                <td style={{border: 'solid black 1px'}}>{job.pid}</td>
                <td style={{border: 'solid black 1px'}}>{job.port}</td>
              </tr>)}
            </table>}
            {brick['heal']['file'] && brick['heal']['file'].length !== 0 && <div>
              <h4>Files needing healing</h4>
              { map(brick['heal']['file'], file =>
                <Row>
                  <Col size={4}>{file['_']}</Col><Col size={4}>{file['gfid']}</Col>
                </Row>)}</div>}
          </div>
        </div>
      )}
      <h2>Volume</h2>
      {this.state.volumeInfo && <div>
        <Row key='name'>
          <Col size={3}><strong>Name</strong></Col>
          <Col size={4}>{this.state.volumeInfo['name']}</Col>
        </Row>
        <Row key='statusStr'>
          <Col size={3}><strong>Status</strong></Col>
          <Col size={4}>{this.state.volumeInfo['statusStr']}</Col>
        </Row>
        <Row key='typeStr'>
          <Col size={3}><strong>Type</strong></Col>
          <Col size={4}>{this.state.volumeInfo['typeStr']}</Col>
        </Row>
        <Row key='brickCount'>
          <Col size={3}><strong>Brick Count</strong></Col>
          <Col size={4}>{this.state.volumeInfo['brickCount']}</Col>
        </Row>
        <Row key='stripeCount'>
          <Col size={3}><strong>Stripe Count</strong></Col>
          <Col size={4}>{this.state.volumeInfo['stripeCount']}</Col>
        </Row>
        <Row key='replicaCount'>
          <Col size={3}><strong>Replica Count</strong></Col>
          <Col size={4}>{this.state.volumeInfo['replicaCount']}</Col>
        </Row>
        <Row key='arbiterCount'>
          <Col size={3}><strong>Arbiter Count</strong></Col>
          <Col size={4}>{this.state.volumeInfo['arbiterCount']}</Col>
        </Row>
        <Row key='disperseCount'>
          <Col size={3}><strong>Disperse Count</strong></Col>
          <Col size={4}>{this.state.volumeInfo['disperseCount']}</Col>
        </Row>
        <Row key='redundancyCount'>
          <Col size={3}><strong>Redundancy Count</strong></Col>
          <Col size={4}>{this.state.volumeInfo['redundancyCount']}</Col>
        </Row>
      </div>}
      <h3>Volume Options</h3>
      {map(this.state.volumeInfo.options, option =>
        <Row key={option.name}>
          <Col size={3}><strong>{option.name}</strong></Col>
          <Col size={4}>{option.value}</Col>
        </Row>
      )}
    </Container >) : (<Container />)
  }
}
