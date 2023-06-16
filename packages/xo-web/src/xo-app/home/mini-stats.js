import Component from 'base-component'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import { Col, Row } from 'grid'
import { CpuSparkLines, LoadSparkLines, NetworkSparkLines, XvdSparkLines } from 'xo-sparklines'

import styles from './index.css'

const MINI_STATS_PROPS = {
  height: 10,
  strokeWidth: 0.2,
  width: 50,
}

export default class MiniStats extends Component {
  static propTypes = {
    fetchStats: PropTypes.func.isRequired,
  }

  state = {
    statsIsPending: false,
  }

  _fetch = () => {
    if (this.state.statsIsPending) {
      return
    }
    this.setState({
      statsIsPending: true,
    })
    this.props.fetch().then(stats => {
      this.setState({ stats, statsIsPending: false })
    })
  }

  componentWillMount() {
    this._fetch()
    this._interval = setInterval(this._fetch, 5e3)
  }

  componentWillUnmount() {
    clearInterval(this._interval)
  }

  render() {
    const { stats } = this.state

    if (stats === undefined) {
      return <Icon icon='loading' />
    }

    return (
      <Row>
        <Col mediumSize={4} className={styles.itemExpanded}>
          <CpuSparkLines data={stats} {...MINI_STATS_PROPS} />
        </Col>
        <Col mediumSize={4} className={styles.itemExpanded}>
          <NetworkSparkLines data={stats} {...MINI_STATS_PROPS} />
        </Col>
        <Col mediumSize={4} className={styles.itemExpanded}>
          {stats.stats.load !== undefined ? (
            <LoadSparkLines data={stats} {...MINI_STATS_PROPS} />
          ) : (
            <XvdSparkLines data={stats} {...MINI_STATS_PROPS} />
          )}
        </Col>
      </Row>
    )
  }
}
