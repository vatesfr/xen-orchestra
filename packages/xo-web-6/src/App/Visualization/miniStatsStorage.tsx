import React, { Component } from 'react'

import { YAxis, AreaChart, Legend } from 'recharts'
import Xo from 'xo-lib'

import { Area } from 'recharts'
import { number } from 'prop-types'

const xo = new Xo({ url: '/' })

xo.open().then(() => xo.signIn({ email: 'admin@admin.net', password: 'admin' }))
const signedIn = new Promise(resolve => xo.once('authenticated', resolve))
const xoCall = (method: any, params: any) =>
  signedIn.then(() => xo.call(method, params))

const NB_VALUES = 118
const tabId = [
  'a5954951-3dfa-42b8-803f-4bc270b22a0b',
  '9a208896-fff9-caa0-d3ab-6ada542ae8ca',
  'a889b334-5ea2-c43d-f0c0-9fb8e7c42425',
]

const allColors = [
  '#493BD8',
  '#ADD83B',
  '#D83BB7',
  '#3BC1D8',
  '#aabd8a',
  '#667772',
  '#FA8072',
  '#800080',
  '#00FF00',
  '#8abda7',
  '#cee866',
  '#6f9393',
  '#bb97cd',
  '#8778db',
  '#2f760b',
  '#a9578a',
  '#C0C0C0',
  '#000080',
  '#000000',
  '#800000',
]
export default class Visualization extends Component<any, any> {
  state: any = {
    srIds: 0,
  }

  render() {
    return (
      <div>
        <div>
          <StoragesIopsStats srIds={tabId} />
        </div>
        <div>
          <StoragesLatencyStats srIds={tabId} />
        </div>
        <div>
          <StoragesIowaitStats srIds={tabId} />
        </div>
        <div>
          <StoragesThroughputStats srIds={tabId} />
        </div>
      </div>
    )
  }
}





class StoragesIowaitStats extends Component<any, any> {
  state: any = {
    srId: 0,
    valueMaxIowait: 0,
  }
  setMaxIowait = (value: number) => {
    if (this.state.valueMaxIowait < value) {
      this.setState({
        valueMaxIowait: value,
      })
    }
  }
  render() {
    return this.props.srIds.map((srId: any) => (
      <StorageIowaitStats
        srId={srId}
        key={srId}
        setMaxIowait={this.setMaxIowait}
        valueMaxIowait={this.state.valueMaxIowait}
      />
    ))
  }
}

class StoragesIopsStats extends Component<any, any> {
  state: any = {
    srId: 0,
    valueMaxIops: 0,
  }
  setMaxGlobal = (maxGlobal: number) => {
    if (this.state.valueMaxIops < maxGlobal) {
      this.setState({
        valueMaxIops: maxGlobal,
      })
    }
  }
  render() {
    return this.props.srIds.map((srId: any) => (
      <StorageIopsStats
        srId={srId}
        key={srId}
        setMaxGlobal={this.setMaxGlobal}
        valueMaxIops={this.state.valueMaxIops}
      />
    ))
  }
}

class StoragesLatencyStats extends Component<any, any> {
  state: any = {
    srId: 0,
    valueMaxLatency: 0,
  }

  setMaxLatency = (value: number) => {
    if (this.state.valueMaxLatency < value) {
      this.setState({
        valueMaxLatency: value,
      })
    }
  }
  render() {
    return this.props.srIds.map((srId: any) => (
      <StorageLatencyStats
        srId={srId}
        key={srId}
        setMaxLatency={this.setMaxLatency}
        valueMaxLatency={this.state.valueMaxLatency}
      />
    ))
  }
}

class StoragesThroughputStats extends Component<any, any> {
  state: any = {
    srId: 0,
    valueMaxThroughput: 0,
  }

  setMaxThroughput = (value: number) => {
    if (this.state.valueMaxThroughput < value) {
      this.setState({
        valueMaxThroughput: value,
      })
    }
  }
  render() {
    return this.props.srIds.map((srId: any) => (
      <StorageThroughputStats
        srId={srId}
        key={srId}
        setMaxThroughput={this.setMaxThroughput}
        valueMaxThroughput={this.state.valueMaxThroughput}
      />
    ))
  }
}

class StorageLatencyStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    latencyData: [],
    latencySr: [],
    maxLatency: 0,
  }

  componentDidMount() {
    setInterval(this.fetchSrStats.bind(this), 5e3)
  }

  fetchSrStats = () => {
    xoCall('sr.stats', {
      id: this.props.srId,
      granularity: this.state.granularity,
    }).then(({ endTimestamp, interval, stats: { latency } }) => {
      this.setState({ latencySr: Object.keys(latency) })

      const latencyData: any[] = []

      for (var i = 0; i < NB_VALUES; i++) {
        const valuesSrLatency: any = {}
        this.state.latencySr.forEach((property: string | number) => {
          const latencyValues = latency[property][i]
          if(this.state.maxLatency === undefined || latencyValues> this.state.maxLatency ){
            this.setState({ maxLatency: latencyValues })
          }
          valuesSrLatency[`latency_${property}`] = latency[property][i]
        })
        valuesSrLatency.time =
          (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
        latencyData.push(valuesSrLatency)
      }

      this.setState({ latencyData })
    })

    this.props.setMaxLatency(this.state.maxLatency)
  }

  render() {
    return (
      <div>
        <div> Latency </div>
        <br />
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.state.latencyData}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => tick + ' ms'}
              domain={[0, Math.max(30, this.props.valueMaxLatency)]}
            />
            <Legend iconType='rect' iconSize={10} />
            {this.state.latencySr.map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`latency_${property}`}
                stroke={allColors[index]}
                fill={allColors[index]}
              />
            ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class StorageIopsStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    iopsData: [],
    iopsSr: [],
    localMaxIops: 0,
    maxIpos: 0,
    valueMaxIops: 0,
  }

  componentDidMount() {
    setInterval(this.fetchSrStats.bind(this), 5e3)
  }

  fetchSrStats = () => {
    xoCall('sr.stats', {
      id: this.props.srId,
      granularity: this.state.granularity,
    }).then(({ endTimestamp, stats: { iops }, interval }) => {
      this.setState({ iopsSr: Object.keys(iops) })

      const iopsData: any[] = []

      for (var i = 0; i < NB_VALUES; i++) {
        const valuesSrIops: any = {}

        valuesSrIops.time =
          (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000

        this.state.iopsSr.forEach((property: string | number) => {
          const iopsValue = iops[property][i]
          if (
            this.state.maxIpos === undefined ||
            iopsValue > this.state.maxIpos
          ) {
            this.setState({ maxIpos: iopsValue })
          }
          valuesSrIops[`iops_${property}`] = iopsValue
        })

        iopsData.push(valuesSrIops)
      }

      this.setState({ iopsData })
    })

    this.props.setMaxGlobal(this.state.maxIpos)
  }

  render() {
    return (
      <div>
        <br />
        <div>IOPS (IOPS)</div>
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.state.iopsData}
            syncId='sr'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => tick + ' IOPS'}
              domain={[0, Math.max(40, this.props.valueMaxIops)]}
            />
            <Legend iconType='rect' iconSize={10} />
            {this.state.iopsSr.map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`iops_${property}`}
                stroke={allColors[index]}
                fill={allColors[index]}
              />
            ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class StorageIowaitStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    dataSrIowait: [],
    iowaitSr: [],
    maxIOwait: 0,
  }
  componentDidMount() {
    setInterval(this.fetchSrStats.bind(this), 5e3)
  }

  fetchSrStats = () => {
    xoCall('sr.stats', {
      id: this.props.srId,
      granularity: this.state.granularity,
    }).then(({ endTimestamp, interval, stats: { iowait } }) => {
      this.setState({ iowaitSr: Object.keys(iowait) })

      const dataSrIowait: any[] = []

      for (var i = 0; i < NB_VALUES; i++) {
        const valuesSrIowait: any = {}
        this.state.iowaitSr.forEach((property: string | number) => {
          valuesSrIowait[`iowait_${property}`] = iowait[property][i]
        })
        valuesSrIowait.time =
          (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
        dataSrIowait.push(valuesSrIowait)
      }
      this.state.iowaitSr.forEach((property: string | number) => {
        this.setState({ maxIOwait: Math.max(...iowait[property]) })
      })
      this.setState({ dataSrIowait })
    })
    this.props.setMaxIowait(this.state.maxIOwait)
  }

  render() {
    return (
      <div>
        <div>IOwait</div>
        <br />
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.state.dataSrIowait}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => tick + ' %'}
              domain={[0, Math.max(5, this.props.valueMaxIowait)]}
            />
            <Legend iconType='rect' iconSize={10} />
            {this.state.iowaitSr.map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`iowait_${property}`}
                stroke={allColors[index]}
                fill={allColors[index]}
              />
            ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class StorageThroughputStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    throughputData: [],
    throSr: [],
    maxIoThroughput: 0,
  }

  componentDidMount() {
    setInterval(this.fetchSrStats.bind(this), 5e3)
  }

  fetchSrStats = () => {
    xoCall('sr.stats', {
      id: this.props.srId,
      granularity: this.state.granularity,
    }).then(({ endTimestamp, interval, stats: { ioThroughput } }) => {
      this.setState({ throSr: Object.keys(ioThroughput) })
      const throughputData: any[] = []
      for (var i = 0; i < NB_VALUES; i++) {
        const valuesSrThro: any = {}
        this.state.throSr.forEach((property: string | number) => {
        const throughputValue= ioThroughput[property][i]
        if(this.state.maxIoThroughput=== undefined || throughputValue> this.state.maxIoThroughput){
          this.setState({ maxIoThroughput: throughputValue })
        }
        
          valuesSrThro[`thr_${property}`] = ioThroughput[property][i]
        })
        valuesSrThro.time =
          (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
        throughputData.push(valuesSrThro)
      }

      this.setState({ throughputData })
    })
    this.props.setMaxThroughput(this.state.maxIoThroughput)
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
            width={400}
            height={100}
            data={this.state.throughputData}
            syncId='sr'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => this.formatBytes(tick, 2)}
              domain={[0, Math.max(1000000, this.props.valueMaxThroughput)]}
            />

            <Legend iconType='rect' iconSize={10} />
            {this.state.throSr.map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`thr_${property}`}
                stroke={allColors[index]}
                fill={allColors[index]}
              />
            ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}