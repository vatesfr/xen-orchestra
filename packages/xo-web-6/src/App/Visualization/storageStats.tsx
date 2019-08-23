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
const NB_VALUES = 118

export default class Visualization extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    //  SR
    //  IOPS
    iopsData: [],
    iopsSr: [],
    maxIOPS: 0,

    //  IO Throughput
    throughputData: [],
    throSr: [],
    maxIoThroughput: 0,

    //  Latency
    latencyData: [],
    latencySr: [],
    maxLatency: 0,

    //  IOwait
    dataSrIowait: [],
    iowaitSr: [],
    maxIOwait: 0,
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

        this.setState({ iopsSr: Object.keys(iops) })
        this.setState({ throSr: Object.keys(ioThroughput) })
        this.setState({ latencySr: Object.keys(latency) })
        this.setState({ iowaitSr: Object.keys(iowait) })

        const iopsData: any[] = []
        const throughputData: any[] = []
        const latencyData: any[] = []
        const dataSrIowait: any[] = []

        for (var i = 0; i < NB_VALUES; i++) {
          const valuesSrIops: any = {}
          const valuesSrThro: any = {}
          const valuesSrLatency: any = {}
          const valuesSrIowait: any = {}

          valuesSrIops.time = moment(
            (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          ).format(format)

          this.state.iopsSr.forEach((property: string | number) => {
            valuesSrIops[`iops_${property}`] = iops[property][i]
          })

          this.state.throSr.forEach((property: string | number) => {
            valuesSrThro[`thr_${property}`] = ioThroughput[property][i]
          })

          this.state.latencySr.forEach((property: string | number) => {
            valuesSrLatency[`latency_${property}`] = latency[property][i]
          })

          this.state.iowaitSr.forEach((property: string | number) => {
            valuesSrIowait[`iowait_${property}`] = iowait[property][i]
          })

          valuesSrLatency.time = valuesSrIops.time
          valuesSrThro.time = valuesSrIops.time
          valuesSrIowait.time = valuesSrIops.time

          iopsData.push(valuesSrIops)
          throughputData.push(valuesSrThro)
          latencyData.push(valuesSrLatency)
          dataSrIowait.push(valuesSrIowait)
        }

        this.state.latencySr.forEach((property: string | number) => {
          this.setState({ maxLatency: Math.max(...latency[property]) })
        })

        this.state.iopsSr.forEach((property: string | number) => {
          this.setState({ maxIOPS: Math.max(...iops[property]) })
        })

        this.state.iowaitSr.forEach((property: string | number) => {
          this.setState({ maxIOwait: Math.max(...iowait[property]) })
        })

        this.state.throSr.forEach((property: string | number) => {
          this.setState({
            maxIoThroughput: Math.max(...ioThroughput[property]),
          })
        })
        this.setState({ iopsData, throughputData, latencyData, dataSrIowait })
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
          iopsData={this.state.iopsData}
          iopsSr={this.state.iopsSr}
          maxIOPS={this.state.maxIOPS}
        />
        <SrIOThroGraph
          throughputData={this.state.throughputData}
          throSr={this.state.throSr}
          maxIoThroughput={this.state.maxIoThroughput}
        />
        <SrLatencyGraph
          latencyData={this.state.latencyData}
          latencySr={this.state.latencySr}
          maxLatency={this.state.maxLatency}
        />
        <SrIoWaitGraph
          dataSrIowait={this.state.dataSrIowait}
          iowaitSr={this.state.iowaitSr}
          maxIOwait={this.state.maxIOwait}
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
            data={this.props.iopsData}
            syncId='sr'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => value + ' IOPS'}
              domain={[0, Math.max(40, this.props.maxIOPS)]}
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
                data={this.props.iopsData}
                margin={GRAPH_CONFIG}
              >
                {this.props.iopsSr.map((property: any, index: any) => (
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
            {this.props.iopsSr.map((property: any, index: any) => (
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

  formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 B/s'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = [
      'B/s',
      'KB/s',
      'MB/s',
      'GB/s',
      'TB/s',
      'PB/s',
      'EB/s',
      'ZB/s',
      'YB/s',
    ]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
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
            data={this.props.throughputData}
            syncId='sr'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => this.formatBytes(value, 2)}
              domain={[0, Math.max(1024e3, this.props.maxIoThroughput)]}
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
                data={this.props.throughputData}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.throSr.map((property: any, index: any) => (
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
            {this.props.throSr.map((property: any, index: any) => (
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
            data={this.props.latencyData}
            syncId='sr'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => value + ' ms'}
              domain={[0, Math.max(30, this.props.maxLatency)]}
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
                data={this.props.latencyData}
                margin={GRAPH_CONFIG}
              >
                {this.props.latencySr.map((property: any, index: any) => (
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
            {this.props.latencySr.map((property: any, index: any) => (
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
            data={this.props.dataSrIowait}
            syncId='sr'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => value + ' %'}
              domain={[0, Math.max(5, this.props.maxIOwait)]}
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
                data={this.props.dataSrIowait}
                margin={GRAPH_CONFIG}
              >
                {this.props.iowaitSr.map((property: any, index: any) => (
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
            {this.props.iowaitSr.map((property: any, index: any) => (
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
