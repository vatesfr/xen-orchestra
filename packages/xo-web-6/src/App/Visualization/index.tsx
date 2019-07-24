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
import moment from 'moment'
const NB_VALUES = 118

const xo = new Xo({ url: '/' })
xo.open().then(() => xo.signIn({ email: 'admin@admin.net', password: 'admin' }))
const signedIn = new Promise(resolve => xo.once('authenticated', resolve))
const xoCall = (method, params) => signedIn.then(() => xo.call(method, params))

export default class Visualization extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    //  VM
    //  Cpu
    dataVmCpu: [],
    propVmCpus: [],

    startIndexCpuVm: 0,
    endIndexCpuVm: 0,

    //  Memory
    dataVmMemory: [],
    startIndexMemoryVm: 0,
    endIndexMemoryVm: 0,

    //  Network
    dataVmNetwork: [],
    propVmNetworkTx: [],
    propVmNetworkRx: [],
    startIndexNetworkVm: 0,
    endIndexNetworkVm: 0,

    //  Disk
    dataVmDisk: [],
    propXvds: [],
    propXvdsR: [],
    startIndexDiskVm: 0,
    endIndexDiskVm: 0,

    //  Host
    //  cpu
    dataHostCpu: [],
    propHostCpus: [],
    startIndexCpuHost: 0,
    endIndexCpuHost: 0,

    // Memory
    dataHostMemory: [],
    startIndexMemoryHost: 0,
    endIndexMemoryHost: 0,

    //  Network
    dataHostNetwork: [],
    propHostNetworkRx: [],
    propHostNetworkTx: [],
    startIndexNetworkHost: 0,
    endIndexNetworkHost: 0,

    //  Load
    dataHostLoad: [],
    startIndexLoadHost: 0,
    endIndexLoadHost: 0,

    //  SR
    //  IOPS
    dataSrIops: [],
    propSrIops: [],
    startIndexIopsSR: 0,
    endIndexIopsSR: 0,

    //  IO Throughput
    dataSrThro: [],
    propSrThro: [],
    startIndexIOSR: 0,
    endIndexIOSR: 0,

    //  Latency
    dataSrLatency: [],
    propSrLatency: [],
    startIndexLatencySR: 0,
    endIndexLatencySR: 0,

    //  IOwait
    dataSrIowait: [],
    propSrIowait: [],
    startIndexIOwaitSR: 0,
    endIndexIOwaitSR: 0,
  }

  componentDidMount() {
    setInterval(this.fetchVmStats.bind(this), 5e3)
    setInterval(this.fetchHostStats.bind(this), 5e3)
    setInterval(this.fetchSrStats.bind(this), 5e3)
  }

  fetchVmStats = () => {
    xoCall('vm.stats', {
      id: '28851ef6-951c-08bc-a5be-8898e2a31b7a',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        stats: { cpus },
        interval,
        stats: { memory },
        stats: { vifs },
        stats: { xvds },
      }) => {
        let format: any
        if (interval === 3600 || interval === 5 || interval === 60) {
          format = 'LTS'
        } else if (interval === 86400) {
          format = 'l'
        }

        this.setState({ propVmCpus: Object.keys(cpus) })

        this.setState({ propVmNetworkTx: Object.keys(vifs.tx) })
        this.setState({ propVmNetworkRx: Object.keys(vifs.rx) })

        this.setState({ propXvds: Object.keys(xvds.w) })
        this.setState({ propXvdsR: Object.keys(xvds.r) })

        const dataVmCpu: any[] = []
        const dataVmMemory: any[] = []
        const dataVmNetwork: any[] = []
        const dataVmDisk: any[] = []

        for (var i = 0; i < NB_VALUES; i++) {
          const valuesCpus: any = {}
          const valuesMemory: any = {}
          const valuesNetwork: any = {}
          const ValuesDisk: any = {}
          valuesCpus.time = moment(
            (endTimestamp - (NB_VALUES - i - 1) * interval) * 10
          ).format(format)

          this.state.propVmCpus.forEach((property: string | number) => {
            valuesCpus[`cpu${property}`] = cpus[property][i]
          })

          this.state.propVmNetworkTx.forEach((property: string | number) => {
            valuesNetwork[`vifs_tx_${property}`] = vifs.tx[property][i]
          })

          this.state.propVmNetworkRx.forEach((property: string | number) => {
            valuesNetwork[`vifs_rx_${property}`] = vifs.rx[property][i]
          })

          this.state.propXvds.forEach((property: string | number) => {
            ValuesDisk[`xvds_w_${property}`] = xvds.w[property][i]
          })

          this.state.propXvdsR.forEach((property: string | number) => {
            ValuesDisk[`xvds_R_${property}`] = xvds.r[property][i]
          })
          valuesMemory.memory = memory[i]

          valuesMemory.time = valuesCpus.time
          valuesNetwork.time = valuesCpus.time
          ValuesDisk.time = valuesCpus.time

          dataVmDisk.push(ValuesDisk)
          dataVmCpu.push(valuesCpus)
          dataVmMemory.push(valuesMemory)
          dataVmNetwork.push(valuesNetwork)
        }
        this.setState({ dataVmCpu, dataVmMemory, dataVmNetwork, dataVmDisk })
      }
    )
  }

  fetchHostStats = () => {
    xoCall('host.stats', {
      host: '73bb5ce0-f720-4621-bd68-98341b094bad',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        stats: { cpus },
        interval,
        stats: { load },
        stats: { memory },
        stats: { pifs },
      }) => {
        let format: any
        if (interval === 3600 || interval === 5 || interval === 60) {
          format = 'LTS'
        } else if (interval === 86400) {
          format = 'l'
        }

        this.setState({ propHostCpus: Object.keys(cpus) })
        this.setState({ propHostNetworkRx: Object.keys(pifs.rx) })
        this.setState({ propHostNetworkTx: Object.keys(pifs.tx) })

        const dataHostCpu: any[] = []
        const dataHostMemory: any[] = []
        const dataHostNetwork: any[] = []
        const dataHostLoad: any[] = []

        for (var i = 0; i < NB_VALUES; i++) {
          const valuesHost: any = {}
          const valuesHostMemory: any = {}
          const valuesHostNetwork: any = {}
          const valuesLoad: any = {}

          valuesHost.time = moment(
            (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          ).format(format)

          this.state.propHostCpus.forEach((property: string | number) => {
            valuesHost[`cpu${property}`] = cpus[property][i]
          })

          this.state.propHostNetworkRx.forEach((property: string | number) => {
            valuesHostNetwork[`pifs_rx_${property}`] = pifs.rx[property][i]
          })

          this.state.propHostNetworkTx.forEach((property: string | number) => {
            valuesHostNetwork[`pifs_tx_${property}`] = pifs.tx[property][i]
          })

          valuesLoad.load = load[i]
          valuesHostMemory.memory = memory[i]

          valuesHostMemory.time = valuesHost.time
          valuesHostNetwork.time = valuesHost.time
          valuesLoad.time = valuesHost.time

          dataHostCpu.push(valuesHost)
          dataHostMemory.push(valuesHostMemory)
          dataHostNetwork.push(valuesHostNetwork)
          dataHostLoad.push(valuesLoad)
        }
        this.setState({
          dataHostCpu,
          dataHostMemory,
          dataHostNetwork,
          dataHostLoad,
        })
      }
    )
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
        if (interval === 3600 || interval === 5 || interval === 60) {
          format = 'LTS'
        } else if (interval === 86400) {
          format = 'l'
        }

        this.setState({ propSrIops: Object.keys(iops) })
        this.setState({ propSrThro: Object.keys(ioThroughput) })
        this.setState({ propSrLatency: Object.keys(latency) })
        this.setState({ propSrIowait: Object.keys(iowait) })

        const dataSrIops: any[] = []
        const dataSrThro: any[] = []
        const dataSrLatency: any[] = []
        const dataSrIowait: any[] = []

        for (var i = 0; i < NB_VALUES; i++) {
          const valuesSrIops: any = {}
          const valuesSrThro: any = {}
          const valuesSrLatency: any = {}
          const valuesSrIowait: any = {}

          valuesSrIops.time = moment(
            (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          ).format(format)

          this.state.propSrIops.forEach((property: string | number) => {
            valuesSrIops[`iops_${property}`] = iops[property][i]
          })

          this.state.propSrThro.forEach((property: string | number) => {
            valuesSrThro[`thr_${property}`] = ioThroughput[property][i]
          })

          this.state.propSrLatency.forEach((property: string | number) => {
            valuesSrLatency[`latency_${property}`] = latency[property][i]
          })

          this.state.propSrIowait.forEach((property: string | number) => {
            valuesSrIowait[`iowait_${property}`] = iowait[property][i]
          })

          valuesSrLatency.time = valuesSrIops.time
          valuesSrThro.time = valuesSrIops.time
          valuesSrIowait.time = valuesSrIops.time

          dataSrIops.push(valuesSrIops)
          dataSrThro.push(valuesSrThro)
          dataSrLatency.push(valuesSrLatency)
          dataSrIowait.push(valuesSrIowait)
        }
        this.setState({ dataSrIops, dataSrThro, dataSrLatency, dataSrIowait })
      }
    )
  }

  setTime = (event: any) => {
    this.setState({ granularity: event.target.value }, () => {
      this.fetchVmStats()
    })
    this.setState({ granularity: event.target.value }, () => {
      this.fetchHostStats()
    })
    this.setState({ granularity: event.target.value }, () => {
      this.fetchSrStats()
    })
  }

  render() {
    return (
      <div>
        <div>
          <form>
            <select onChange={this.setTime} value={this.state.granularity}>
              <option value='seconds'>Last 5 secondes</option>
              <option value='minutes'>Last 10 minutes</option>
              <option value='hours'>Last 2 hours</option>
              <option value='days'>Last year</option>
            </select>
          </form>
        </div>
        <VuVmCpuStats
          dataVmCpu={this.state.dataVmCpu}
          propVmCpus={this.state.propVmCpus}
        />
        <VuVmMemoryStats dataVmMemory={this.state.dataVmMemory} />
        <VuVmNetworkStats
          dataVmNetwork={this.state.dataVmNetwork}
          propVmNetworkTx={this.state.propVmNetworkTx}
          propVmNetworkRx={this.state.propVmNetworkRx}
        />
        <VuVmDiskStats
          dataVmDisk={this.state.dataVmDisk}
          propXvds={this.state.propXvds}
          propXvdsR={this.state.propXvdsR}
        />
        <VuHostCpuStats
          dataHostCpu={this.state.dataHostCpu}
          propHostCpus={this.state.propHostCpus}
        />
        <VuHostMemoryStats dataHostMemory={this.state.dataHostMemory} />
        <VuHostNetworkStats
          dataHostNetwork={this.state.dataHostNetwork}
          propHostNetworkRx={this.state.propHostNetworkRx}
          propHostNetworkTx={this.state.propHostNetworkTx}
        />
        <VuHostLoadStats dataHostLoad={this.state.dataHostLoad} />
        <VuSrIOPSstats
          dataSrIops={this.state.dataSrIops}
          propSrIops={this.state.propSrIops}
        />
        <VuSrIOThroStats
          dataSrThro={this.state.dataSrThro}
          propSrThro={this.state.propSrThro}
        />
        <VuSrLatencyStats
          dataSrLatency={this.state.dataSrLatency}
          propSrLatency={this.state.propSrLatency}
        />
        <VuSrIoWaitStats
          dataSrIowait={this.state.dataSrIowait}
          propSrIowait={this.state.propSrIowait}
        />
      </div>
    )
  }
}

class VuVmCpuStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexCpuVm: 0,
    endIndexCpuVm: 0,
  }

  handleChangeCpuVm = (res: any) => {
    this.setState({ startIndexCpuVm: res.startIndex })
    this.setState({ endIndexCpuVm: res.endIndex })
  }

  render() {
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
    ]
    return (
      <div>
        <div>
          <h2>VMs stats </h2>
        </div>
        <div>CPU usage</div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataVmCpu}
            syncId='vm'
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
              tickFormatter={tick => tick + ' %'}
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeCpuVm}
              startIndex={this.state.startIndexCpuVm}
              endIndex={this.state.endIndexCpuVm}
            >
              <AreaChart
                width={830}
                height={350}
                data={this.props.dataVmCpu}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.propVmCpus
                  .map((currProperty: any) => `cpu${currProperty}`)
                  .map((property: any, index: any) => (
                    <Area
                      stackId='3'
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
            {this.props.propVmCpus
              .map((currProperty: any) => `cpu${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  stackId='3'
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

class VuVmMemoryStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexMemoryVm: 0,
    endIndexMemoryVm: 0,
  }

  handleChangeMemoryVm = (res: any) => {
    this.setState({ startIndexMemoryVm: res.startIndex })
    this.setState({ endIndexMemoryVm: res.endIndex })
  }

  formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + '' + sizes[i]
  }

  render() {
    return (
      <div>
        <div>Memory usage</div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataVmMemory}
            syncId='vm'
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
              axisLine={false}
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => this.formatBytes(tick, 0)}
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeMemoryVm}
              startIndex={this.state.startIndexMemoryVm}
              endIndex={this.state.endIndexMemoryVm}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.dataVmMemory}
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

class VuVmNetworkStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexNetworkVm: 0,
    endIndexNetworkVm: 0,
  }

  handleChangeNetworkVm = (res: any) => {
    this.state.startIndexNetworkVm = res.startIndex
    this.state.endIndexNetworkVm = res.endIndex
  }

  formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  render() {
    const colors = [
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
    ]
    return (
      <div>
        <br />
        <div>Network throughput</div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataVmNetwork}
            syncId='vm'
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
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeNetworkVm}
              startIndex={this.state.startIndexNetworkVm}
              endIndex={this.state.endIndexNetworkVm}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.dataVmNetwork}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.propVmNetworkTx
                  .map((currProperty: any) => `vifs_tx_${currProperty}`)
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
                {this.props.propVmNetworkRx
                  .map((currProperty: any) => `vifs_rx_${currProperty}`)
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={property}
                      stroke={colors[index]}
                      fill={colors[index]}
                    />
                  ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.propVmNetworkTx
              .map((currProperty: any) => `vifs_tx_${currProperty}`)
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
            {this.props.propVmNetworkRx
              .map((currProperty: any) => `vifs_rx_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={colors[index]}
                  fill={colors[index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuVmDiskStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexDiskVm: 0,
    endIndexDiskVm: 0,
  }

  handleChangeDiskVm = (res: any) => {
    this.state.startIndexDiskVm = res.startIndex
    this.state.endIndexDiskVm = res.endIndex
  }

  formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  render() {
    const colors = [
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
    ]
    return (
      <div>
        <br />
        <div>Disk throughput</div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataVmDisk}
            syncId='vm'
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
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeDiskVm}
              startIndex={this.state.startIndexDiskVm}
              endIndex={this.state.endIndexDiskVm}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.state.dataVmDisk}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.propXvds
                  .map((currProperty: any) => `xvds_w_${currProperty}`)
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
                {this.props.propXvdsR
                  .map((currProperty: any) => `xvds_R_${currProperty}`)
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={property}
                      stroke={colors[index]}
                      fill={colors[index]}
                    />
                  ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.propXvds
              .map((currProperty: any) => `xvds_w_${currProperty}`)
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
            {this.props.propXvdsR
              .map((currProperty: any) => `xvds_R_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={colors[index]}
                  fill={colors[index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuHostCpuStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexCpuHost: 0,
    endIndexCpuHost: 0,
  }

  handleChangeCpuHost = (res: any) => {
    this.state.startIndexCpuHost = res.startIndex
    this.state.endIndexCpuHost = res.endIndex
  }

  render() {
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
    ]
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
                {this.props.propHostCpus
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
            {this.props.propHostCpus
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

class VuHostMemoryStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexMemoryHost: 0,
    endIndexMemoryHost: 0,
  }

  handleChangeMemoryHost = (res: any) => {
    this.state.startIndexMemoryHost = res.startIndex
    this.state.endIndexMemoryHost = res.endIndex
  }
  formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

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

class VuHostNetworkStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexNetworkHost: 0,
    endIndexNetworkHost: 0,
  }

  handleChangeNetworkHost = (res: any) => {
    this.state.startIndexNetworkHost = res.startIndex
    this.state.endIndexNetworkHost = res.endIndex
  }

  formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  render() {
    const colors = [
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
    ]
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
                {this.props.propHostNetworkRx
                  .map((currProperty: any) => `pifs_rx_${currProperty}`)
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
                {this.props.propHostNetworkTx
                  .map((currProperty: any) => `pifs_tx_${currProperty}`)
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={property}
                      stroke={colors[index]}
                      fill={colors[index]}
                    />
                  ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.propHostNetworkRx
              .map((currProperty: any) => `pifs_rx_${currProperty}`)
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
            {this.props.propHostNetworkTx
              .map((currProperty: any) => `pifs_tx_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={colors[index]}
                  fill={colors[index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuHostLoadStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexLoadHost: 0,
    endIndexLoadHost: 0,
  }

  handleChangeLoadHost = (res: any) => {
    this.state.startIndexLoadHost = res.startIndex
    this.state.endIndexLoadHost = res.endIndex
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
            <YAxis tick={{ fontSize: '11px' }} />
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
                  stroke='#3BC1D8'
                  fill='#3BC1D8'
                />
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            <Area
              type='monotone'
              dataKey='load'
              stroke='#3BC1D8'
              fill='#3BC1D8'
            />
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuSrIOPSstats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexIopsSR: 0,
    endIndexIopsSR: 0,
  }

  handleChangeIopsSR = (res: any) => {
    this.state.startIndexIopsSR = res.startIndex
    this.state.endIndexIopsSR = res.endIndex
  }

  render() {
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
    ]
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
            data={this.props.dataSrIops}
            syncId='sr'
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
              tickFormatter={tick => tick + ' IOPS'}
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeIopsSR}
              startIndex={this.state.startIndexIopsSR}
              endIndex={this.state.endIndexIopsSR}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.dataSrIops}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.propSrIops
                  .map((currProperty: any) => `iops_${currProperty}`)
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
            {this.props.propSrIops
              .map((currProperty: any) => `iops_${currProperty}`)
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

class VuSrIOThroStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexIOSR: 0,
    endIndexIOSR: 0,
  }

  handleChangeIOSR = (res: any) => {
    this.state.startIndexIOSR = res.startIndex
    this.state.endIndexIOSR = res.endIndex
  }

  formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  render() {
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
    ]
    return (
      <div>
        <div>IO throughput </div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataSrThro}
            syncId='sr'
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
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeIOSR}
              startIndex={this.state.startIndexIOSR}
              endIndex={this.state.endIndexIOSR}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.dataSrThro}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.propSrThro
                  .map((currProperty: any) => `thr_${currProperty}`)
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
            {this.props.propSrThro
              .map((currProperty: any) => `thr_${currProperty}`)
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

class VuSrLatencyStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexLatencySR: 0,
    endIndexLatencySR: 0,
  }

  handleChangeLatencySR = (res: any) => {
    this.state.startIndexLatencySR = res.startIndex
    this.state.endIndexLatencySR = res.endIndex
  }

  render() {
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
    ]
    return (
      <div>
        <div> Latency </div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataSrLatency}
            syncId='sr'
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
              tickFormatter={tick => tick + ' ms'}
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeLatencySR}
              startIndex={this.state.startIndexLatencySR}
              endIndex={this.state.endIndexLatencySR}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.dataSrLatency}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.propSrLatency
                  .map((currProperty: any) => `latency_${currProperty}`)
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
            {this.props.propSrLatency
              .map((currProperty: any) => `latency_${currProperty}`)
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

class VuSrIoWaitStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexIOwaitSR: 0,
    endIndexIOwaitSR: 0,
  }

  handleChangeIOwaitSR = (res: any) => {
    this.state.startIndexIOwaitSR = res.startIndex
    this.state.endIndexIOwaitSR = res.endIndex
  }

  render() {
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
    ]
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
              tickFormatter={tick => tick + ' %'}
            />
            <Tooltip />
            <Brush
              onChange={this.handleChangeIOwaitSR}
              startIndex={this.state.startIndexIOwaitSR}
              endIndex={this.state.endIndexIOwaitSR}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.dataSrIowait}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.propSrIowait
                  .map((currProperty: any) => `iowait_${currProperty}`)
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
            {this.props.propSrIowait
              .map((currProperty: any) => `iowait_${currProperty}`)
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
