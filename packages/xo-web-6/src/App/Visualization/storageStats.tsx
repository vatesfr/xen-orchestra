import React, { Component } from 'react'
import {
  XAxis,
  YAxis,
  AreaChart,
  Tooltip,
  Legend,
  Area,
  Brush,
  CartesianGrid,
} from 'recharts'
import { allColors, xoCall } from './utils'
import moment from 'moment'
import humanFormat from 'human-format'

const NB_VALUES = 118

export default class Visualization extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    //  SR
    //  IOPS
    srIopsData: [],
    srIops: [],
    srIopsMax: 0,

    //  IO Throughput
    srIoThroughputData: [],
    srIoThroughputs: [],
    srIoThroughputMax: 0,

    //  Latency
    srLatencyData: [],
    srLatency: [],
    srLatencyMax: 0,

    //  IOwait
    srIowaitData: [],
    srIowait: [],
    srIowaitMax: 0,
  }

  componentDidMount() {
    setInterval(this.fetchSrStats.bind(this), 5e3)
  }

  fetchSrStats = () => {
    xoCall('sr.stats', {
      id: 'a5954951-3dfa-42b8-803f-4bc270b22a0b',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        stats: { iops },
        interval,
        stats: { latency },
        stats: { iowait },
        stats: { ioThroughput },
      }) => {
        let format: any
        if (interval === 5 || interval === 60) {
          format = 'LTS'
        } else if (interval === 86400 || interval === 3600) {
          format = 'l'
        }

        this.setState({ srIops: Object.keys(iops) })
        this.setState({ srIoThroughputs: Object.keys(ioThroughput) })
        this.setState({ srLatency: Object.keys(latency) })
        this.setState({ srIowait: Object.keys(iowait) })

        const srIopsData: any[] = []
        const srIoThroughputData: any[] = []
        const srLatencyData: any[] = []
        const srIowaitData: any[] = []

        for (var i = 0; i < NB_VALUES; i++) {
          const srIopsValues: any = {}
          const srThroValues: any = {}
          const srLatencyValues: any = {}
          const srIowaitValues: any = {}

          srIopsValues.time = moment(
            (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          ).format(format)

          this.state.srIops.forEach((property: string | number) => {
            srIopsValues[`iops_${property}`] = iops[property][i]
          })

          this.state.srIoThroughputs.forEach((property: string | number) => {
            srThroValues[`thr_${property}`] = ioThroughput[property][i]
          })

          this.state.srLatency.forEach((property: string | number) => {
            srLatencyValues[`latency_${property}`] = latency[property][i]
          })

          this.state.srIowait.forEach((property: string | number) => {
            srIowaitValues[`iowait_${property}`] = iowait[property][i]
          })

          srLatencyValues.time = srIopsValues.time
          srThroValues.time = srIopsValues.time
          srIowaitValues.time = srIopsValues.time

          srIopsData.push(srIopsValues)
          srIoThroughputData.push(srThroValues)
          srLatencyData.push(srLatencyValues)
          srIowaitData.push(srIowaitValues)
        }

        this.state.srLatency.forEach((property: string | number) => {
          this.setState({ srLatencyMax: Math.max(...latency[property]) })
        })

        this.state.srIops.forEach((property: string | number) => {
          this.setState({ srIopsMax: Math.max(...iops[property]) })
        })

        this.state.srIowait.forEach((property: string | number) => {
          this.setState({ srIowaitMax: Math.max(...iowait[property]) })
        })

        this.state.srIoThroughputs.forEach((property: string | number) => {
          this.setState({
            srIoThroughputMax: Math.max(...ioThroughput[property]),
          })
        })
        this.setState({
          srIopsData,
          srIoThroughputData,
          srLatencyData,
          srIowaitData,
        })
      }
    )
  }

  setGranularity = (event: any) => {
    this.setState({ granularity: event.target.value }, () => {
      this.fetchSrStats()
    })
  }

  render() {
    return (
      <div>
        <div>
          <form>
            <select
              onChange={this.setGranularity}
              value={this.state.granularity}
            >
              <option value='seconds'>Last 10 minutes</option>
              <option value='minutes'>Last 2 hours</option>
              <option value='hours'>Last week</option>
              <option value='days'>Last year</option>
            </select>
          </form>
        </div>
        <SrIOPSGraph
          srIopsData={this.state.srIopsData}
          srIops={this.state.srIops}
          srIopsMax={this.state.srIopsMax}
        />
        <SrIOThroGraph
          srIoThroughputData={this.state.srIoThroughputData}
          srIoThroughputs={this.state.srIoThroughputs}
          srIoThroughputMax={this.state.srIoThroughputMax}
        />
        <SrLatencyGraph
          srLatencyData={this.state.srLatencyData}
          srLatency={this.state.srLatency}
          srLatencyMax={this.state.srLatencyMax}
        />
        <SrIoWaitGraph
          srIowaitData={this.state.srIowaitData}
          srIowait={this.state.srIowait}
          srIowaitMax={this.state.srIowaitMax}
        />
      </div>
    )
  }
}
const GRAPH_CONFIG = { top: 5, right: 20, left: 90, bottom: 5 }

class SrIOPSGraph extends Component<any, any> {
  state: any = {
    startIndexIopsSR: 0,
    endIndexIopsSR: 0,
  }

  handleSrIopsZoomChange = (res: any) => {
    this.setState({ startIndexIopsSR: res.startIndex })
    this.setState({ endIndexIopsSR: res.endIndex })
  }

  render() {
    return (
      <div>
        <div>
          <h2>SR stats </h2>
        </div>
        <br />
        <div>IOPS (IOPS)</div>
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.srIopsData}
            syncId='sr'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => value + ' IOPS'}
              domain={[0, Math.max(40, this.props.srIopsMax)]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleSrIopsZoomChange}
              startIndex={this.state.startIndexIopsSR}
              endIndex={this.state.endIndexIopsSR}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.srIopsData}
                margin={GRAPH_CONFIG}
              >
                {this.props.srIops.map((property: any, index: any) => (
                  <Area
                    connectNulls
                    isAnimationActive={false}
                    type='monotone'
                    dataKey={`iops_${property}`}
                    stroke={allColors[index]}
                    fill={allColors[index]}
                    key={index}
                  />
                ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.srIops.map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`iops_${property}`}
                stroke={allColors[index]}
                fill={allColors[index]}
                key={index}
              />
            ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class SrIOThroGraph extends Component<any, any> {
  state: any = {
    startIndexIOSR: 0,
    endIndexIOSR: 0,
  }

  handleSrIOZoomChange = (res: any) => {
    this.setState({ startIndexIOSR: res.startIndex })
    this.setState({ endIndexIOSR: res.endIndex })
  }

  render() {
    return (
      <div>
        <div>IO throughput </div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.srIoThroughputData}
            syncId='sr'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value =>
                humanFormat(value, { scale: 'binary', unit: 'B' })
              }
              domain={[0, Math.max(1024e3, this.props.srIoThroughputMax)]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleSrIOZoomChange}
              startIndex={this.state.startIndexIOSR}
              endIndex={this.state.endIndexIOSR}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.srIoThroughputData}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.srIoThroughputs.map((property: any, index: any) => (
                  <Area
                    connectNulls
                    isAnimationActive={false}
                    type='monotone'
                    dataKey={`thr_${property}`}
                    stroke={allColors[index]}
                    fill={allColors[index]}
                    key={index}
                  />
                ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.srIoThroughputs.map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`thr_${property}`}
                stroke={allColors[index]}
                fill={allColors[index]}
                key={index}
              />
            ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class SrLatencyGraph extends Component<any, any> {
  state: any = {
    startIndexLatencySR: 0,
    endIndexLatencySR: 0,
  }

  handleSrLatencyZoomChange = (res: any) => {
    this.setState({ startIndexLatencySR: res.startIndex })
    this.setState({ endIndexLatencySR: res.endIndex })
  }

  render() {
    return (
      <div>
        <div> Latency </div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.srLatencyData}
            syncId='sr'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => value + ' ms'}
              domain={[0, Math.max(30, this.props.srLatencyMax)]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleSrLatencyZoomChange}
              startIndex={this.state.startIndexLatencySR}
              endIndex={this.state.endIndexLatencySR}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.srLatencyData}
                margin={GRAPH_CONFIG}
              >
                {this.props.srLatency.map((property: any, index: any) => (
                  <Area
                    connectNulls
                    isAnimationActive={false}
                    type='monotone'
                    dataKey={`latency_${property}`}
                    stroke={allColors[index]}
                    fill={allColors[index]}
                    key={index}
                  />
                ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.srLatency.map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`latency_${property}`}
                stroke={allColors[index]}
                fill={allColors[index]}
                key={index}
              />
            ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class SrIoWaitGraph extends Component<any, any> {
  state: any = {
    startIndexIOwaitSR: 0,
    endIndexIOwaitSR: 0,
  }

  handleSrIowaitZoomChange = (res: any) => {
    this.setState({ startIndexIOwaitSR: res.startIndex })
    this.setState({ endIndexIOwaitSR: res.endIndex })
  }

  render() {
    return (
      <div>
        <div>IOwait</div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.srIowaitData}
            syncId='sr'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => value + ' %'}
              domain={[0, Math.max(5, this.props.srIowaitMax)]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleSrIowaitZoomChange}
              startIndex={this.state.startIndexIOwaitSR}
              endIndex={this.state.endIndexIOwaitSR}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.srIowaitData}
                margin={GRAPH_CONFIG}
              >
                {this.props.srIowait.map((property: any, index: any) => (
                  <Area
                    connectNulls
                    isAnimationActive={false}
                    type='monotone'
                    dataKey={`iowait_${property}`}
                    stroke={allColors[index]}
                    fill={allColors[index]}
                    key={index}
                  />
                ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.srIowait.map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`iowait_${property}`}
                stroke={allColors[index]}
                fill={allColors[index]}
                key={index}
              />
            ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}
