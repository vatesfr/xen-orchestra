import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { Col, Row } from 'grid'
import { createSelector } from 'selectors'
import {
  addSubscriptions,
  createFakeProgress
} from 'utils'
import {
  subscribeCheckSrCurrentState
} from 'xo'
import {
  slice,
  sum
} from 'lodash'

const ESTIMATED_DURATIONS = [
  10, // configuringNetwork
  50, // importingVm
  30, // copyingVms
  30, // configuringVms
  10, // configuringGluster
  5,  // creatingSr
  5   // scanningSr
]

const TOTAL_ESTIMATED_DURATION = sum(ESTIMATED_DURATIONS)

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

  _getMainProgress = createSelector(
    () => this.props.currentState && this.props.currentState.state,
    () => this.state.intermediateProgress,
    (state, intermediateProgress) => {
      if (state == null) {
        return null
      }

      return sum(slice(ESTIMATED_DURATIONS, 0, state)) + intermediateProgress * ESTIMATED_DURATIONS[state]
    }
  )

  render () {
    const { currentState, pool } = this.props

    if (currentState == null || currentState.operation !== 'createSr') {
      return null
    }

    const { state, states } = currentState

    return <Row>
      <Col size={3}>
        <strong>{_('xosanCreatingOn', { pool: pool.name_label })}</strong>
      </Col>
      <Col size={3}>
        ({state + 1}/{states.length}) {_(`xosanState_${states[state]}`)}
      </Col>
      <Col size={6}>
        <progress
          className='progress'
          max={TOTAL_ESTIMATED_DURATION}
          value={this._getMainProgress()}
        />
      </Col>
    </Row>
  }
}
