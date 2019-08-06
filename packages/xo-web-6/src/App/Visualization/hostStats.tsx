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
const xoCall = (method:string, params:object) => signedIn.then(() => xo.call(method, params))

const getObject = (id: any) =>
  xoCall('xo.getAllObjects', { filter: { id } }).then(objects => objects[id])

export default class Visualization extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',

    //  Host
    //  cpu
    cpuDataHost: [],
    cpusHost: [],

    // Memory
    memoryDataHost: [],
    memoryMaxHost: 0,

    //  Network
    networkDataHost: [],
    networksRxHost: [],
    networksTransmissionHost: [],
    networksReceptionHost: [],

    //  Load
    loadDataHost: [],
    maxLoad: 0,
  }

  componentDidMount() {
    setInterval(this.fetchHostStats.bind(this), 5e3)
  }

  fetchHostStats = () => {
    getObject('470b64a4-2767-4e1d-a20c-fbc2a6d4de57').then((host: any) => {
      this.setState({ memoryMaxHost: host.memory.size })
    })
   
    xoCall('host.stats', {
      host: '470b64a4-2767-4e1d-a20c-fbc2a6d4de57',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        stats: { cpus },
        interval,
        stats: { load },
        stats: { memory, memoryFree = memory },
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
        this.setState({ networksTransmissionHost: Object.keys(pifs.tx) })

        let cpuDataHost: any[] = []
        let memoryDataHost: any[] = []
        let networkDataHost: any[] = []
        let loadDataHost: any[] = []
        let newDataMemory: any = []
  
          newDataMemory = memoryFree.map(
            (value: any, index: any) => memory[index] - value
          )
        
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

          this.state.networksTransmissionHost.forEach((property: string | number) => {
            valuesHostNetwork[`pifs_${property}_(tx)`] = pifs.tx[property][i]
          })

          valuesLoad.load = load[i]
          valuesHostMemory.memory = newDataMemory[i]
          valuesHostMemory.time = valuesHost.time
          valuesHostNetwork.time = valuesHost.time
          valuesLoad.time = valuesHost.time
          cpuDataHost.push(valuesHost)
          networkDataHost.push(valuesHostNetwork)
          loadDataHost.push(valuesLoad)
          memoryDataHost.push(valuesHostMemory)
        }

        this.state.maxLoad = Math.max(...load)

        this.state.networksTransmissionHost.forEach((property: string | number) => {
          this.setState({ maxNetworkTx: Math.max(...pifs.tx[property]) })
        })

        this.state.networksRxHost.forEach((property: string | number) => {
          this.setState({ maxNetworkRx: Math.max(...pifs.rx[property]) })
        })

        this.setState({
          networksReceptionHost: Math.max(
            this.state.maxNetworkTx,
            this.state.maxNetworkRx
          ),
        })

        this.setState({
          cpuDataHost,
          memoryDataHost,
          networkDataHost,
          loadDataHost,
        })
      }
    )
  }

  setGranularity = (event: any) => {
    this.setState({ granularity: event.target.value }, () => {
      this.fetchHostStats()
    })
  }

  render() {
    return (
      <div>
        <div>
          <form>
            <select onChange={this.setGranularity} value={this.state.granularity}>
              <option value='seconds'>Last 10 minutes</option>
              <option value='minutes'>Last 2 hours</option>
              <option value='hours'>Last week</option>
              <option value='days'>Last year</option>
            </select>
          </form>
        </div>

        <CpuHostGraph
          cpuDataHost={this.state.cpuDataHost}
          cpusHost={this.state.cpusHost}
        />
        <MemoryHostGraph
          memoryDataHost={this.state.memoryDataHost}
          memoryMaxHost={this.state.memoryMaxHost}
        />
        <NetworkHostGraph
          networkDataHost={this.state.networkDataHost}
          networksRxHost={this.state.networksRxHost}
          networksTransmissionHost={this.state.networksTransmissionHost}
          networksReceptionHost={this.state.networksReceptionHost}
        />
        <LoadHostGraph
          loadDataHost={this.state.loadDataHost}
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

class CpuHostGraph extends Component<any, any> {
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
            data={this.props.cpuDataHost}
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
                data={this.props.cpuDataHost}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.cpusHost
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={`cpu${property}`}
                      stroke={allColors[index]}
                      fill={allColors[index]}
                    />
                  ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.cpusHost
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={ `cpu${property}`}
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

class MemoryHostGraph extends Component<any, any> {
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
            data={this.props.memoryDataHost}
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
              domain={[0, this.props.memoryMaxHost]}
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
                data={this.props.memoryDataHost}
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

class NetworkHostGraph extends Component<any, any> {
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
            data={this.props.networkDataHost}
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
              domain={[0, Math.max(1000000, this.props.networksReceptionHost)]}
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
                data={this.props.networkDataHost}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                 {[ ...this.props.networksRxHost, ...this.props.networksTransmissionHost]
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={`pifs_${property}_(${index < this.props.networksRxHost.length ? 'rx' : 'tx'})`}
                      stroke={allColors[index]}
                      fill={allColors[index]}
                    />
                  ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {[ ...this.props.networksRxHost, ...this.props.networksTransmissionHost]
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={`pifs_${property}_(${index < this.props.networksRxHost.length ? 'rx' : 'tx'})`}
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

class LoadHostGraph extends Component<any, any> {
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
            data={this.props.loadDataHost}
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
                data={this.props.loadDataHost}
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
