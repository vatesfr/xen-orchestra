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

const getObjects = (id: any) =>
  xoCall('xo.getAllObjects', { filter: { id } }).then(objects => objects[id])

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
    valueMaxVmMemory: 0,

    //  Network
    dataVmNetwork: [],
    propVmNetworkTx: [],
    propVmNetworkRx: [],
    startIndexNetworkVm: 0,
    endIndexNetworkVm: 0,
    maxNetwork: 0,

    //  Disk
    dataVmDisk: [],
    propXvds: [],
    propXvdsR: [],
    startIndexDiskVm: 0,
    endIndexDiskVm: 0,
    maxDisk: 0,

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
    ValueMaxHostMemory: 0,

    //  Network
    dataHostNetwork: [],
    propHostNetworkRx: [],
    propHostNetworkTx: [],
    startIndexNetworkHost: 0,
    endIndexNetworkHost: 0,
    maxNetworkHost: 0,

    //  Load
    dataHostLoad: [],
    startIndexLoadHost: 0,
    endIndexLoadHost: 0,
    maxLoad: 0,

    //  SR
    //  IOPS
    dataSrIops: [],
    propSrIops: [],
    startIndexIopsSR: 0,
    endIndexIopsSR: 0,
    maxIOPS: 0,

    //  IO Throughput
    dataSrThro: [],
    propSrThro: [],
    startIndexIOSR: 0,
    endIndexIOSR: 0,
    maxIoThroughput: 0,

    //  Latency
    dataSrLatency: [],
    propSrLatency: [],
    startIndexLatencySR: 0,
    endIndexLatencySR: 0,
    maxLatency: 0,

    //  IOwait
    dataSrIowait: [],
    propSrIowait: [],
    startIndexIOwaitSR: 0,
    endIndexIOwaitSR: 0,
    maxIOwait: 0,
  }

  componentDidMount() {
    setInterval(this.fetchVmStats.bind(this), 5e3)
    setInterval(this.fetchHostStats.bind(this), 5e3)
    setInterval(this.fetchSrStats.bind(this), 5e3)
  }

  fetchVmStats = () => {
    getObjects('28851ef6-951c-08bc-a5be-8898e2a31b7a').then((vm: any) => {
      this.setState({ valueMaxVmMemory: vm.memory.dynamic[1] })
    })

    xoCall('vm.stats', {
      id: '28851ef6-951c-08bc-a5be-8898e2a31b7a',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        stats: { cpus },
        interval,
        stats: { memory },
        stats: { memoryFree },
        stats: { vifs },
        stats: { xvds },
      }) => {

        let format: any
        if (interval === 5 || interval === 60) {
          format = 'LTS'
        } else if (interval === 86400 || interval === 3600) {
          format = 'l'
        } 

        this.setState({ propVmCpus: Object.keys(cpus) })

        this.setState({ propVmNetworkTx: Object.keys(vifs.tx) })
        this.setState({ propVmNetworkRx: Object.keys(vifs.rx) })

        this.setState({ propXvds: Object.keys(xvds.w) })
        this.setState({ propXvdsR: Object.keys(xvds.r) })

        let dataVmCpu: any[] = []
        let dataVmMemory: any[] = []
        let dataVmNetwork: any[] = []
        let dataVmDisk: any[] = []
        let newDataMemory: any[] = []

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
          let valuesCpus: any = {}
          let valuesMemory: any = {}
          let valuesNetwork: any = {}
          let ValuesDisk: any = {}

            valuesCpus.time = moment(
             (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
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

          valuesMemory.memory = newDataMemory[i]

          valuesMemory.time = valuesCpus.time
          valuesNetwork.time = valuesCpus.time
          ValuesDisk.time = valuesCpus.time
          dataVmDisk.push(ValuesDisk)
          dataVmCpu.push(valuesCpus)
          dataVmNetwork.push(valuesNetwork)
          dataVmMemory.push(valuesMemory)
        }

        for (var i = 0; i < this.state.propVmNetworkTx.length; i++) {
          this.state.propVmNetworkTx.forEach((property: string | number) => {
            this.state.maxNetworkTx = Math.max(...vifs.tx[property])
          })
        }

        for (var i = 0; i < this.state.propVmNetworkRx.length; i++) {
          this.state.propVmNetworkRx.forEach((property: string | number) => {
            this.state.maxNetworkRx = Math.max(...vifs.rx[property])
          })
        }

        this.state.maxNetwork = Math.max(
          this.state.maxNetworkTx,
          this.state.maxNetworkRx
        )

        for (var i = 0; i < this.state.propXvds.length; i++) {
          this.state.propXvds.forEach((property: string | number) => {
            this.state.maxDiskW = Math.max(...xvds.w[property])
          })
        }

        for (var i = 0; i < this.state.propXvdsR.length; i++) {
          this.state.propXvdsR.forEach((property: string | number) => {
            this.state.maxDiskR = Math.max(...xvds.r[property])
          })
        }
        this.state.maxDisk = Math.max(this.state.maxDiskW, this.state.maxDiskR)

        this.setState({ dataVmCpu, dataVmMemory, dataVmNetwork, dataVmDisk })
      }
    )
  }

  fetchHostStats = () => {
    getObjects('470b64a4-2767-4e1d-a20c-fbc2a6d4de57').then((host: any) => {
      this.setState({ ValueMaxHostMemory: host.memory.size })
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
        stats: { memory },
        stats: { memoryFree },
        stats: { pifs },
      }) => {
        let format: any
        if ( interval === 5 || interval === 60) {
          format = 'LTS'
        } else if (interval === 86400 || interval === 3600) {
          format = 'l'
        }

        this.setState({ propHostCpus: Object.keys(cpus) })
        this.setState({ propHostNetworkRx: Object.keys(pifs.rx) })
        this.setState({ propHostNetworkTx: Object.keys(pifs.tx) })

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

        for (var i = 0; i < this.state.propHostNetworkTx.length; i++) {
          this.state.propHostNetworkTx.forEach((property: string | number) => {
            this.state.maxNetworkTx = Math.max(...pifs.tx[property])
          })
        }

        for (var i = 0; i < this.state.propHostNetworkRx.length; i++) {
          this.state.propHostNetworkRx.forEach((property: string | number) => {
            this.state.maxNetworkRx = Math.max(...pifs.rx[property])
          })
        }

        this.state.maxNetworkHost = Math.max(
          this.state.maxNetworkTx,
          this.state.maxNetworkRx
        )

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
        if ( interval === 5 || interval === 60) {
          format = 'LTS'
        } else if (interval === 86400 || interval ===3600) {
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

        for (var i = 0; i < this.state.propSrLatency.length; i++) {
          this.state.propSrLatency.forEach((property: string | number) => {
            this.state.maxLatency = Math.max(...latency[property])
          })
        }

        for (var i = 0; i < this.state.propSrIops.length; i++) {
          this.state.propSrIops.forEach((property: string | number) => {
            this.state.maxIOPS = Math.max(...iops[property])
          })
        }

        for (var i = 0; i < this.state.propSrIowait.length; i++) {
          this.state.propSrIowait.forEach((property: string | number) => {
            this.state.maxIOwait = Math.max(...iowait[property])
          })
        }

        for (var i = 0; i < this.state.propSrThro.length; i++) {
          this.state.propSrThro.forEach((property: string | number) => {
            this.state.maxIoThroughput = Math.max(...ioThroughput[property])
          })
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
              <option value='seconds'>Last 10 minutes</option>
              <option value='minutes'>Last 2 hours</option>
              <option value='hours'>Last week</option>
              <option value='days'>Last year</option>
            </select>
          </form>
        </div>
        <VuVmCpuStats
          dataVmCpu={this.state.dataVmCpu}
          propVmCpus={this.state.propVmCpus}
        />
        <VuVmMemoryStats
          dataVmMemory={this.state.dataVmMemory}
          valueMaxVmMemory={this.state.valueMaxVmMemory}
        />

        <VuVmNetworkStats
          dataVmNetwork={this.state.dataVmNetwork}
          propVmNetworkTx={this.state.propVmNetworkTx}
          propVmNetworkRx={this.state.propVmNetworkRx}
          maxNetwork={this.state.maxNetwork}
        />
        <VuVmDiskStats
          dataVmDisk={this.state.dataVmDisk}
          propXvds={this.state.propXvds}
          propXvdsR={this.state.propXvdsR}
          maxDisk={this.state.maxDisk}
        />
        <VuHostCpuStats
          dataHostCpu={this.state.dataHostCpu}
          propHostCpus={this.state.propHostCpus}
        />
        <VuHostMemoryStats
          dataHostMemory={this.state.dataHostMemory}
          ValueMaxHostMemory={this.state.ValueMaxHostMemory}
        />
        <VuHostNetworkStats
          dataHostNetwork={this.state.dataHostNetwork}
          propHostNetworkRx={this.state.propHostNetworkRx}
          propHostNetworkTx={this.state.propHostNetworkTx}
          maxNetworkHost={this.state.maxNetworkHost}
        />
        <VuHostLoadStats
          dataHostLoad={this.state.dataHostLoad}
          maxLoad={this.state.maxLoad}
        />
        <VuSrIOPSstats
          dataSrIops={this.state.dataSrIops}
          propSrIops={this.state.propSrIops}
          maxIOPS={this.state.maxIOPS}
        />
        <VuSrIOThroStats
          dataSrThro={this.state.dataSrThro}
          propSrThro={this.state.propSrThro}
          maxIoThroughput={this.state.maxIoThroughput}
        />
        <VuSrLatencyStats
          dataSrLatency={this.state.dataSrLatency}
          propSrLatency={this.state.propSrLatency}
          maxLatency={this.state.maxLatency}
        />
        <VuSrIoWaitStats
          dataSrIowait={this.state.dataSrIowait}
          propSrIowait={this.state.propSrIowait}
          maxIOwait={this.state.maxIOwait}
        />
      </div>
    )
  }
}

class VuVmCpuStats extends Component<any, any> {
  state: any = {
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
    startIndexMemoryVm: 0,
    endIndexMemoryVm: 0,
  }

  handleChangeMemoryVm = (res: any) => {
    this.setState({ startIndexMemoryVm: res.startIndex })
    this.setState({ endIndexMemoryVm: res.endIndex })
  }

  formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 B'

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
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => this.formatBytes(tick, 0)}
              domain={[0, this.props.valueMaxVmMemory]}
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
    startIndexNetworkVm: 0,
    endIndexNetworkVm: 0,
  }

  handleChangeNetworkVm = (res: any) => {
    this.state.startIndexNetworkVm = res.startIndex
    this.state.endIndexNetworkVm = res.endIndex
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
              domain={[0, Math.max(1000000, this.props.maxNetwork)]}
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
    startIndexDiskVm: 0,
    endIndexDiskVm: 0,
  }

  handleChangeDiskVm = (res: any) => {
    this.state.startIndexDiskVm = res.startIndex
    this.state.endIndexDiskVm = res.endIndex
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
              domain={[0, Math.max(1000000000, this.props.maxDisk)]}
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
    startIndexMemoryHost: 0,
    endIndexMemoryHost: 0,
  }

  handleChangeMemoryHost = (res: any) => {
    this.state.startIndexMemoryHost = res.startIndex
    this.state.endIndexMemoryHost = res.endIndex
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

class VuHostNetworkStats extends Component<any, any> {
  state: any = {
    startIndexNetworkHost: 0,
    endIndexNetworkHost: 0,
  }

  handleChangeNetworkHost = (res: any) => {
    this.state.startIndexNetworkHost = res.startIndex
    this.state.endIndexNetworkHost = res.endIndex
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
              domain={[0, Math.max(40, this.props.maxIOPS)]}
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
    startIndexIOSR: 0,
    endIndexIOSR: 0,
  }

  handleChangeIOSR = (res: any) => {
    this.state.startIndexIOSR = res.startIndex
    this.state.endIndexIOSR = res.endIndex
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
              domain={[0, Math.max(1000000, this.props.maxIoThroughput)]}
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
              domain={[0, Math.max(30, this.props.maxLatency)]}
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
              domain={[0, Math.max(5, this.props.maxIOwait)]}
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
