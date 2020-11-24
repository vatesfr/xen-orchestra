import _ from 'intl'
import ActionButton from 'action-button'
import cloneDeep from 'lodash/cloneDeep'
import Component from 'base-component'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import map from 'lodash/map'
import PropTypes from 'prop-types'
import React from 'react'
import renderXoItem from 'render-xo-item'
import sortBy from 'lodash/sortBy'
import Upgrade from 'xoa-upgrade'
import XoWeekCharts from 'xo-week-charts'
import XoWeekHeatmap from 'xo-week-heatmap'
import { Container, Row, Col } from 'grid'
import { error } from 'notification'
import { SelectHostVm } from 'select-objects'
import { createGetObjectsOfType } from 'selectors'
import { connectStore, formatSize, getMemoryUsedMetric, mapPlus } from 'utils'
import { fetchHostStats, fetchVmStats } from 'xo'

// ===================================================================

const computeMetricArray = (stats, { metricKey, metrics, objectId, timestampStart, valueRenderer }) => {
  if (!stats) {
    return
  }

  if (!metrics[metricKey]) {
    metrics[metricKey] = {
      key: metricKey,
      renderer: valueRenderer,
      values: {}, // Stats of all object for one metric.
    }
  }

  // Stats of one object.
  metrics[metricKey].values[objectId] = map(stats, (value, i) => ({
    value: +value,
    date: timestampStart + 3600000 * i,
  }))
}

// ===================================================================

const computeCpusMetric = (cpus, { objectId, ...params }) => {
  forEach(cpus, (cpu, index) => {
    computeMetricArray(cpu, {
      metricKey: `CPU ${index}`,
      objectId,
      ...params,
    })
  })

  const nCpus = cpus.length

  if (!nCpus) {
    return
  }

  const { metrics } = params
  const cpusAvg = cloneDeep(metrics['CPU 0'].values[objectId])

  for (let i = 1; i < nCpus; i++) {
    forEach(metrics[`CPU ${i}`].values[objectId], (value, index) => {
      cpusAvg[index].value += value.value
    })
  }

  forEach(cpusAvg, value => {
    value.value /= nCpus
  })

  const allCpusKey = 'All CPUs'

  if (!metrics[allCpusKey]) {
    metrics[allCpusKey] = {
      key: allCpusKey,
      values: {},
    }
  }

  metrics[allCpusKey].values[objectId] = cpusAvg
}

const computeVifsMetric = (vifs, params) => {
  forEach(vifs, (vifs, vifsType) => {
    const rw = vifsType === 'rx' ? 'out' : 'in'

    forEach(vifs, (vif, index) => {
      computeMetricArray(vif, {
        metricKey: `Network ${index} ${rw}`,
        valueRenderer: formatSize,
        ...params,
      })
    })
  })
}

const computePifsMetric = (pifs, params) => {
  forEach(pifs, (pifs, pifsType) => {
    const rw = pifsType === 'rx' ? 'out' : 'in'

    forEach(pifs, (pif, index) => {
      computeMetricArray(pif, {
        metricKey: `NIC ${index} ${rw}`,
        valueRenderer: formatSize,
        ...params,
      })
    })
  })
}

const computeXvdsMetric = (xvds, params) => {
  forEach(xvds, (xvds, xvdsType) => {
    const rw = xvdsType === 'r' ? 'read' : 'write'

    forEach(xvds, (xvd, index) => {
      computeMetricArray(xvd, {
        metricKey: `Disk ${index} ${rw}`,
        valueRenderer: formatSize,
        ...params,
      })
    })
  })
}

const computeLoadMetric = (load, params) => {
  computeMetricArray(load, {
    metricKey: 'Load',
    ...params,
  })
}

const computeMemoryUsedMetric = (memoryUsed, params) => {
  computeMetricArray(memoryUsed, {
    metricKey: 'RAM used',
    valueRenderer: formatSize,
    ...params,
  })
}

// ===================================================================

const METRICS_LOADING = 1
const METRICS_LOADED = 2

const runningObjectsPredicate = object => object.power_state === 'Running'

const STATS_TYPE_TO_COMPUTE_FNC = {
  cpus: computeCpusMetric,
  vifs: computeVifsMetric,
  pifs: computePifsMetric,
  xvds: computeXvdsMetric,
  load: computeLoadMetric,
  memoryUsed: computeMemoryUsedMetric,
}

@connectStore(() => {
  const getRunningHosts = createGetObjectsOfType('host').filter([runningObjectsPredicate]).sort()
  const getRunningVms = createGetObjectsOfType('VM').filter([runningObjectsPredicate]).sort()

  return {
    hosts: getRunningHosts,
    vms: getRunningVms,
  }
})
class SelectMetric extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      objects: [],
      predicate: runningObjectsPredicate,
    }
  }

  _handleSelection = objects => {
    this.setState({
      metricsState: undefined,
      metrics: undefined,
      objects,
      predicate: objects.length
        ? object => runningObjectsPredicate(object) && object.type === objects[0].type
        : runningObjectsPredicate,
    })
  }

  _resetSelection = () => {
    this._handleSelection([])
  }

  _selectAllHosts = () => {
    this.setState({
      metricsState: undefined,
      metrics: undefined,
      objects: this.props.hosts,
      predicate: object => runningObjectsPredicate(object) && object.type === 'host',
    })
  }

  _selectAllVms = () => {
    this.setState({
      metricsState: undefined,
      metrics: undefined,
      objects: this.props.vms,
      predicate: object => runningObjectsPredicate(object) && object.type === 'VM',
    })
  }

  _validSelection = async () => {
    this.setState({ metricsState: METRICS_LOADING })

    const { objects } = this.state
    const getStats = (objects[0].type === 'host' && fetchHostStats) || fetchVmStats

    const metrics = {}

    await Promise.all(
      map(objects, object => {
        return getStats(object, 'hours')
          .then(result => {
            const { stats } = result

            if (stats === undefined) {
              throw new Error('No stats')
            }

            const params = {
              metrics,
              objectId: object.id,
              timestampStart: (result.endTimestamp - 3600 * (stats.memory.length - 1)) * 1000,
            }

            stats.memoryUsed = getMemoryUsedMetric(stats)
            forEach(stats, (stats, type) => {
              const fnc = STATS_TYPE_TO_COMPUTE_FNC[type]

              if (fnc) {
                fnc(stats, params)
              }
            })
          })
          .catch(() => {
            error(
              _('statsDashboardGenericErrorTitle'),
              <span>
                {_('statsDashboardGenericErrorMessage')} {object.name_label || object.id}
              </span>
            )
          })
      })
    )

    this.setState({
      metricsState: METRICS_LOADED,
      metrics: sortBy(metrics, metric => metric.key),
    })
  }

  _handleSelectedMetric = event => {
    const { value } = event.target
    const { state } = this

    this.props.onChange(value !== '' && state.metrics[value], state.objects)
  }

  render() {
    const { metricsState, metrics, objects, predicate } = this.state

    return (
      <Container>
        <Row>
          <Col mediumSize={6}>
            <div className='form-group'>
              <SelectHostVm multi onChange={this._handleSelection} predicate={predicate} value={objects} />
            </div>
            <div className='btn-group mt-1' role='group'>
              <ActionButton handler={this._resetSelection} icon='remove' tooltip={_('dashboardStatsButtonRemoveAll')} />
              <ActionButton handler={this._selectAllHosts} icon='host' tooltip={_('dashboardStatsButtonAddAllHost')} />
              <ActionButton handler={this._selectAllVms} icon='vm' tooltip={_('dashboardStatsButtonAddAllVM')} />
              <ActionButton disabled={!objects.length} handler={this._validSelection} icon='success'>
                {_('statsDashboardSelectObjects')}
              </ActionButton>
            </div>
          </Col>
          <Col mediumSize={6}>
            {metricsState === METRICS_LOADING ? (
              <div>
                <Icon icon='loading' /> {_('metricsLoading')}
              </div>
            ) : (
              metricsState === METRICS_LOADED && (
                <select className='form-control' onChange={this._handleSelectedMetric}>
                  {_('noSelectedMetric', message => (
                    <option value=''>{message}</option>
                  ))}
                  {map(metrics, (metric, key) => (
                    <option key={key} value={key}>
                      {metric.key}
                    </option>
                  ))}
                </select>
              )
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}

// ===================================================================

class MetricViewer extends Component {
  static propTypes = {
    metricRenderer: PropTypes.func.isRequired,
    title: PropTypes.any.isRequired,
  }

  _handleSelectedMetric = (selectedMetric, objects) => {
    this.setState({ selectedMetric, objects })
  }

  render() {
    const {
      props: { metricRenderer, title },
      state: { selectedMetric, objects },
    } = this

    return (
      <div>
        <h3>{title}</h3>
        <SelectMetric onChange={this._handleSelectedMetric} />
        <hr />
        {selectedMetric && (
          <Container>
            <Row>
              <Col>{map(objects, object => renderXoItem(object, { className: 'mr-1' }))}</Col>
            </Row>
            <Row>
              <Col>{metricRenderer(selectedMetric)}</Col>
            </Row>
          </Container>
        )}
      </div>
    )
  }
}

// ===================================================================

const weekHeatmapRenderer = metric => (
  <div>
    <XoWeekHeatmap
      cellRenderer={metric.renderer}
      data={mapPlus(metric.values, (arr, push) => {
        forEach(arr, value => push(value))
      })}
    />
    <hr />
  </div>
)

const weekChartsRenderer = metric => (
  <XoWeekCharts
    series={map(metric.values, (data, id) => ({
      data,
      objectId: id,
    }))}
    valueRenderer={metric.renderer}
  />
)

const Stats = () =>
  process.env.XOA_PLAN > 2 ? (
    <div>
      <MetricViewer metricRenderer={weekHeatmapRenderer} title={_('weeklyHeatmap')} />
      <MetricViewer metricRenderer={weekChartsRenderer} title={_('weeklyCharts')} />
    </div>
  ) : (
    <Container>
      <Upgrade place='dashboardStats' available={3} />
    </Container>
  )

export { Stats as default }
