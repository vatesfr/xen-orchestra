import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { Col, Row } from 'grid'
import { createSelector } from 'selectors'
import { addSubscriptions, createFakeProgress } from 'utils'
import { subscribeCheckSrCurrentState } from 'xo'
import { map, sum } from 'lodash'

const ESTIMATED_DURATIONS = [
  10, // configuringNetwork
  50, // importingVm
  30, // copyingVms
  30, // configuringVms
  10, // configuringGluster
  5, // creatingSr
  5, // scanningSr
]

const TOTAL_ESTIMATED_DURATION = sum(ESTIMATED_DURATIONS)

@addSubscriptions(props => ({
  currentState: cb => subscribeCheckSrCurrentState(props.pool, cb),
}))
export default class CreationProgress extends Component {
  constructor() {
    super()

    this.state = { intermediateProgress: 0 }

    let sum = 0
    let _sum = 0
    this._milestones = map(ESTIMATED_DURATIONS, duration => {
      _sum = sum
      sum += duration

      return _sum
    })
  }

  _startNewFakeProgress = state => {
    this._fakeProgress = createFakeProgress(ESTIMATED_DURATIONS[state])
    this.setState({ intermediateProgress: 0 })
    this._loopProgress()
  }

  _loopProgress = () => {
    this.setState({ intermediateProgress: this._fakeProgress() })
    this._loopTimeout = setTimeout(this._loopProgress, 50)
  }

  componentDidMount() {
    const { currentState } = this.props

    if (currentState && currentState.operation === 'createSr') {
      this._startNewFakeProgress(currentState.state)
    }
  }

  componentWillUnmount() {
    clearTimeout(this._loopTimeout)
  }

  componentWillReceiveProps(props) {
    const oldState = this.props.currentState
    const newState = props.currentState

    if (oldState === newState) {
      return
    }

    clearTimeout(this._loopTimeout)

    if (newState && newState.operation === 'createSr') {
      if (oldState != null) {
        // Step transition: set the end of the milestone to the current position so the
        // progress bar doesn't unsmoothly jump to the actual end of the milestone
        this._milestones[newState.state] = this._getMainProgress()
      }
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

      const previousMilestone = this._milestones[state]
      const stepLength = (this._milestones[state + 1] || TOTAL_ESTIMATED_DURATION) - previousMilestone

      return previousMilestone + intermediateProgress * stepLength
    }
  )

  render() {
    const { currentState, pool } = this.props

    if (currentState == null || currentState.operation !== 'createSr') {
      return null
    }

    const { state, states } = currentState

    return (
      <Row>
        <Col size={3}>
          <strong>{_('xosanCreatingOn', { pool: pool.name_label })}</strong>
        </Col>
        <Col size={3}>
          ({state + 1}/{states.length}) {_(`xosanState_${states[state]}`)}
        </Col>
        <Col size={6}>
          <progress className='progress' max={TOTAL_ESTIMATED_DURATION} value={this._getMainProgress()} />
        </Col>
      </Row>
    )
  }
}
