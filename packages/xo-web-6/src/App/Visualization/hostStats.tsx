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

import Xo from 'xo-lib'
import moment, { max } from 'moment'
const NB_VALUES = 118

const xo = new Xo({ url: '/' })
xo.open().then(() => xo.signIn({ email: 'admin@admin.net', password: 'admin' }))
const signedIn = new Promise(resolve => xo.once('authenticated', resolve))
const xoCall = (method, params) => signedIn.then(() => xo.call(method, params))

const getObject = (id: any) =>
  xoCall('xo.getAllObjects', { filter: { id } }).then(objects => objects[id])

export default class Visualization extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',

    //  Host
    //  cpu
    dataHostCpu: [],
    cpusHost: [],

    // Memory
    dataHostMemory: [],
    ValueMaxHostMemory: 0,

    //  Network
    dataHostNetwork: [],
    networksRxHost: [],
    networksTxHost: [],
    maxNetworkHost: 0,

    //  Load
    dataHostLoad: [],
    maxLoad: 0,
  }

  componentDidMount() {
    setInterval(this.fetchHostStats.bind(this), 5e3)
  }

  fetchHostStats = () => {
    getObject('470b64a4-2767-4e1d-a20c-fbc2a6d4de57').then((host: any) => {
      this.setState({ ValueMaxHostMemory: host.memory.size })
    })
    //ebd131c8-d8df-144a-5997-f1969da1f022
    xoCall('host.stats', {
      host: '470b64a4-2767-4e1d-a20c-fbc2a6d4de57',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        stats: { cpus },
        interval,
        stats: { load },
        stats: { memory },
        stats: { memoryFree },
        stats: { pifs },
      }) => {
        let format: any
        if (interval === 5 || interval === 60) {
          format = 'LTS'
        } else if (interval === 86400 || interval === 3600) {
          format = 'l'
        }

        this.setState({ cpusHost: Object.keys(cpus) })
        this.setState({ networksRxHost: Object.keys(pifs.rx) })
        this.setState({ networksTxHost: Object.keys(pifs.tx) })

        let dataHostCpu: any[] = []
        let dataHostMemory: any[] = []
        let dataHostNetwork: any[] = []
        let dataHostLoad: any[] = []
        let newDataMemory: any = []

        if (memoryFree == undefined) {
          newDataMemory = memory.map(
            (value: any, index: any) => memory[index] - value
          )
        } else {
          newDataMemory = memoryFree.map(
            (value: any, index: any) => memory[index] - value
          )
        }

        for (var i = 0; i < NB_VALUES; i++) {
          let valuesHost: any = {}
          let valuesHostMemory: any = {}
          let valuesHostNetwork: any = {}
          let valuesLoad: any = {}

          valuesHost.time = moment(
            (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          ).format(format)

          this.state.cpusHost.forEach((property: string | number) => {
            valuesHost[`cpu${property}`] = cpus[property][i]
          })

          this.state.networksRxHost.forEach((property: string | number) => {
            valuesHostNetwork[`pifs_${property}_(rx)`] = pifs.rx[property][i]
          })

          this.state.networksTxHost.forEach((property: string | number) => {
            valuesHostNetwork[`pifs_${property}_(tx)`] = pifs.tx[property][i]
          })

          valuesLoad.load = load[i]
          valuesHostMemory.memory = newDataMemory[i]
          valuesHostMemory.time = valuesHost.time
          valuesHostNetwork.time = valuesHost.time
          valuesLoad.time = valuesHost.time
          dataHostCpu.push(valuesHost)
          dataHostNetwork.push(valuesHostNetwork)
          dataHostLoad.push(valuesLoad)
          dataHostMemory.push(valuesHostMemory)
        }

        this.state.maxLoad = Math.max(...load)

        this.state.networksTxHost.forEach((property: string | number) => {
          this.setState({ maxNetworkTx: Math.max(...pifs.tx[property]) })
        })

        this.state.networksRxHost.forEach((property: string | number) => {
          this.setState({ maxNetworkRx: Math.max(...pifs.rx[property]) })
        })

        this.setState({
          maxNetworkHost: Math.max(
            this.state.maxNetworkTx,
            this.state.maxNetworkRx
          ),
        })

        this.setState({
          dataHostCpu,
          dataHostMemory,
          dataHostNetwork,
          dataHostLoad,
        })
      }
    )
  }

  setTime = (event: any) => {
    this.setState({ granularity: event.target.value }, () => {
      this.fetchHostStats()
    })
  }

  render() {
    return (
      <div>
        <div>
          <form>
            <select onChange={this.setTime} value={this.state.granularity}>
              <option value='seconds'>Last 10 minutes</option>
              <option value='minutes'>Last 2 hours</option>
              <option value='hours'>Last week</option>
              <option value='days'>Last year</option>
            </select>
          </form>
        </div>

        <HostCpuGraph
          dataHostCpu={this.state.dataHostCpu}
          cpusHost={this.state.cpusHost}
        />
        <HostMemoryGraph
          dataHostMemory={this.state.dataHostMemory}
          ValueMaxHostMemory={this.state.ValueMaxHostMemory}
        />
        <HostNetworkGraph
          dataHostNetwork={this.state.dataHostNetwork}
          networksRxHost={this.state.networksRxHost}
          networksTxHost={this.state.networksTxHost}
          maxNetworkHost={this.state.maxNetworkHost}
        />
        <HostLoadGraph
          dataHostLoad={this.state.dataHostLoad}
          maxLoad={this.state.maxLoad}
        />
      </div>
    )
  }
}
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

class HostCpuGraph extends Component<any, any> {
  state: any = {
    startIndexCpuHost: 0,
    endIndexCpuHost: 0,
  }

  handleChangeCpuHost = (res: any) => {
    this.setState({ startIndexCpuHost: res.startIndex })
    this.setState({ endIndexCpuHost: res.endIndex })
  }

  render() {
    return (
      <div>
        <div>
          <h2>Host stats </h2>
        </div>
        <br />
        <div>CPU usage</div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataHostCpu}
            syncId='host'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => tick + '%'}
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeCpuHost}
              startIndex={this.state.startIndexCpuHost}
              endIndex={this.state.endIndexCpuHost}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.dataHostCpu}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.cpusHost
                  .map((currProperty: any) => `cpu${currProperty}`)
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={property}
                      stroke={allColors[index]}
                      fill={allColors[index]}
                    />
                  ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.cpusHost
              .map((currProperty: any) => `cpu${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
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

class HostMemoryGraph extends Component<any, any> {
  state: any = {
    startIndexMemoryHost: 0,
    endIndexMemoryHost: 0,
  }

  handleChangeMemoryHost = (res: any) => {
    this.setState({ startIndexMemoryHost: res.startIndex })
    this.setState({ endIndexMemoryHost: res.endIndex })
  }
  formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  render() {
    return (
      <div>
        <div>Memory usage </div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataHostMemory}
            syncId='host'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => this.formatBytes(tick, 2)}
              domain={[0, this.props.ValueMaxHostMemory]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeMemoryHost}
              startIndex={this.state.startIndexMemoryHost}
              endIndex={this.state.endIndexMemoryHost}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.dataHostMemory}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                <Area
                  type='monotone'
                  dataKey='memory'
                  stroke='#493BD8'
                  fill='#493BD8'
                />
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            <Area
              type='monotone'
              dataKey='memory'
              stroke='#493BD8'
              fill='#493BD8'
            />
          </AreaChart>
        </div>
      </div>
    )
  }
}

class HostNetworkGraph extends Component<any, any> {
  state: any = {
    startIndexNetworkHost: 0,
    endIndexNetworkHost: 0,
  }

  handleChangeNetworkHost = (res: any) => {
    this.setState({ startIndexNetworkHost: res.startIndex })
    this.setState({ endIndexNetworkHost: res.endIndex })
  }

  formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  render() {
    return (
      <div>
        <br />
        <div>Network throughput </div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataHostNetwork}
            syncId='host'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => this.formatBytes(tick, 2)}
              domain={[0, Math.max(1000000, this.props.maxNetworkHost)]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeNetworkHost}
              startIndex={this.state.startIndexNetworkHost}
              endIndex={this.state.endIndexNetworkHost}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.dataHostNetwork}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.networksRxHost
                  .map((currProperty: any) => `pifs_${currProperty}_(rx)`)
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={property}
                      stroke={allColors[index]}
                      fill={allColors[index]}
                    />
                  ))}
                {this.props.networksTxHost
                  .map((currProperty: any) => `pifs_${currProperty}_(tx)`)
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={property}
                      stroke={
                        allColors[this.props.networksRxHost.length + index]
                      }
                      fill={allColors[this.props.networksRxHost.length + index]}
                    />
                  ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.networksRxHost
              .map((currProperty: any) => `pifs_${currProperty}_(rx)`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[index]}
                  fill={allColors[index]}
                />
              ))}
            {this.props.networksTxHost
              .map((currProperty: any) => `pifs_${currProperty}_(tx)`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[this.props.networksRxHost.length + index]}
                  fill={allColors[this.props.networksRxHost.length + index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class HostLoadGraph extends Component<any, any> {
  state: any = {
    startIndexLoadHost: 0,
    endIndexLoadHost: 0,
  }

  handleChangeLoadHost = (res: any) => {
    this.setState({ startIndexLoadHost: res.startIndex })
    this.setState({ endIndexLoadHost: res.endIndex })
  }

  render() {
    return (
      <div>
        <div>Load average </div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataHostLoad}
            syncId='host'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              domain={[0, Math.max(1, this.props.maxLoad)]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeLoadHost}
              startIndex={this.state.startIndexLoadHost}
              endIndex={this.state.endIndexLoadHost}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.dataHostLoad}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                <Area
                  type='monotone'
                  dataKey='load'
                  stroke='#493BD8'
                  fill='#493BD8'
                />
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            <Area
              type='monotone'
              dataKey='load'
              stroke='#493BD8'
              fill='#493BD8'
            />
          </AreaChart>
        </div>
      </div>
    )
  }
}
