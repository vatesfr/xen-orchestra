import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { Col, Row } from 'grid'
import {
  addSubscriptions,
  createFakeProgress
} from 'utils'
import {
  subscribeCheckSrCurrentState
} from 'xo'

const ESTIMATED_DURATIONS = [
  10, // configuringNetwork
  50, // importingVm
  30, // copyingVms
  30, // configuringVms
  10, // configuringGluster
  5,  // creatingSr
  5   // scanningSr
]

@addSubscriptions(props => ({
  currentState: cb => subscribeCheckSrCurrentState(props.pool, cb)
}))
export default class CreationProgress extends Component {
  state = { intermediateProgress: 0 }

  _startNewFakeProgress = state => {
    this._fakeProgress = createFakeProgress(ESTIMATED_DURATIONS[state])
    this.setState({ intermediateProgress: 0 })
    this._loopProgress()
  }

  _loopProgress = () => {
    this.setState({ intermediateProgress: this._fakeProgress() })
    this._loopTimeout = setTimeout(this._loopProgress, 100)
  }

  componentDidMount () {
    const { currentState } = this.props

    if (currentState && currentState.operation === 'createSr') {
      this._startNewFakeProgress(currentState.state)
    }
  }

  componentWillUnmount () {
    clearTimeout(this._loopTimeout)
  }

  componentWillReceiveProps (props) {
    const oldState = this.props.currentState
    const newState = props.currentState

    if (oldState === newState) {
      return
    }

    if (newState == null || newState.operation !== 'createSr') {
      clearTimeout(this._loopTimeout)
    }

    if (newState && newState.operation === 'createSr') {
      this._startNewFakeProgress(newState.state)
    }
  }

  render () {
    const { currentState, pool } = this.props
    const { intermediateProgress } = this.state

    if (currentState == null || currentState.operation !== 'createSr') {
      return null
    }

    const { state, states } = currentState

    return <Row>
      <Col size={3}>
        <strong>{pool.name_label}</strong>
      </Col>
      <Col size={3}>
        ({state + 1}/{states.length}) {_(`xosanState_${states[state]}`)}
      </Col>
      <Col size={6}>
        <progress
          className='progress'
          max={states.length}
          value={state + intermediateProgress}
        />
      </Col>
    </Row>
  }
}
