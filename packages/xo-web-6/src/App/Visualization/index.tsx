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
    //  VM
    //  Cpu
    dataVmCpu: [],
    cpusVm: [],

    //  Memory
    dataVmMemory: [],
    valueMaxVmMemory: 0,

    //  Network
    dataVmNetwork: [],
    networksTxVm: [],
    networksRxVm: [],
    maxNetwork: 0,

    //  Disk
    dataVmDisk: [],
    disksW: [],
    disksR: [],

    maxDisk: 0,

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

    //  SR
    //  IOPS
    dataSrIops: [],
    iopsSr: [],
    maxIOPS: 0,

    //  IO Throughput
    dataSrThro: [],
    throSr: [],

    maxIoThroughput: 0,

    //  Latency
    dataSrLatency: [],
    latencySr: [],

    maxLatency: 0,

    //  IOwait
    dataSrIowait: [],
    iowaitSr: [],
    maxIOwait: 0,
  }

  componentDidMount() {
    setInterval(this.fetchVmStats.bind(this), 5e3)
    setInterval(this.fetchHostStats.bind(this), 5e3)
    setInterval(this.fetchSrStats.bind(this), 5e3)
  }

  fetchVmStats = () => {
    getObject('ebd131c8-d8df-144a-5997-f1969da1f022').then((vm: any) => {
      this.setState({ valueMaxVmMemory: vm.memory.dynamic[1] })
    })
    //
    //28851ef6-951c-08bc-a5be-8898e2a31b7a
    xoCall('vm.stats', {
      id: 'ebd131c8-d8df-144a-5997-f1969da1f022',
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

        this.setState({ cpusVm: Object.keys(cpus) })

        this.setState({ networksTxVm: Object.keys(vifs.tx) })
        this.setState({ networksRxVm: Object.keys(vifs.rx) })

        this.setState({ disksW: Object.keys(xvds.w) })
        this.setState({ disksR: Object.keys(xvds.r) })

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

          this.state.cpusVm.forEach((property: string | number) => {
            valuesCpus[`cpu${property}`] = cpus[property][i]
          })

          this.state.networksTxVm.forEach((property: string | number) => {
            valuesNetwork[`vifs_${property}_(tx)`] = vifs.tx[property][i]
          })

          this.state.networksRxVm.forEach((property: string | number) => {
            valuesNetwork[`vifs_${property}_(rx)`] = vifs.rx[property][i]
          })

          this.state.disksW.forEach((property: string | number) => {
            ValuesDisk[`xvds_${property}_(w)`] = xvds.w[property][i]
          })

          this.state.disksR.forEach((property: string | number) => {
            ValuesDisk[`xvds_${property}_(r)`] = xvds.r[property][i]
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

        this.state.networksTxVm.forEach((property: string | number) => {
          this.setState({ maxNetworkTx: Math.max(...vifs.tx[property]) })
        })

        this.state.networksRxVm.forEach((property: string | number) => {
          this.setState({ maxNetworkRx: Math.max(...vifs.rx[property]) })
        })

        this.state.maxNetwork = Math.max(
          this.state.maxNetworkTx,
          this.state.maxNetworkRx
        )

        this.state.disksW.forEach((property: string | number) => {
          this.setState({ maxDiskW: Math.max(...xvds.w[property]) })
        })

        this.state.disksR.forEach((property: string | number) => {
          this.setState({ maxDiskR: Math.max(...xvds.r[property]) })
        })

        this.state.maxDisk = Math.max(this.state.maxDiskW, this.state.maxDiskR)
        this.setState({ dataVmCpu, dataVmMemory, dataVmNetwork, dataVmDisk })
      }
    )
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

          dataSrIops.push(valuesSrIops)
          dataSrThro.push(valuesSrThro)
          dataSrLatency.push(valuesSrLatency)
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
        <VmCpuGraph
          dataVmCpu={this.state.dataVmCpu}
          cpusVm={this.state.cpusVm}
        />
        <VmMemoryGraph
          dataVmMemory={this.state.dataVmMemory}
          valueMaxVmMemory={this.state.valueMaxVmMemory}
        />
        <VmNetworkGraph
          dataVmNetwork={this.state.dataVmNetwork}
          networksTxVm={this.state.networksTxVm}
          networksRxVm={this.state.networksRxVm}
          maxNetwork={this.state.maxNetwork}
        />
        <VmDiskGraph
          dataVmDisk={this.state.dataVmDisk}
          disksW={this.state.disksW}
          disksR={this.state.disksR}
          maxDisk={this.state.maxDisk}
        />
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
        <SrIOPSGraph
          dataSrIops={this.state.dataSrIops}
          iopsSr={this.state.iopsSr}
          maxIOPS={this.state.maxIOPS}
        />
        <SrIOThroGraph
          dataSrThro={this.state.dataSrThro}
          throSr={this.state.throSr}
          maxIoThroughput={this.state.maxIoThroughput}
        />
        <SrLatencyGraph
          dataSrLatency={this.state.dataSrLatency}
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

class VmCpuGraph extends Component<any, any> {
  state: any = {
    startIndexCpuVm: 0,
    endIndexCpuVm: 0,
  }

  handleChangeCpuVm = (res: any) => {
    this.setState({ startIndexCpuVm: res.startIndex })
    this.setState({ endIndexCpuVm: res.endIndex })
  }

  render() {
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
                {this.props.cpusVm
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
            {this.props.cpusVm
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

class VmMemoryGraph extends Component<any, any> {
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

class VmNetworkGraph extends Component<any, any> {
  state: any = {
    startIndexNetworkVm: 0,
    endIndexNetworkVm: 0,
  }

  handleChangeNetworkVm = (res: any) => {
    this.setState({ startIndexNetworkVm: res.startIndex })
    this.setState({ endIndexNetworkVm: res.endIndex })
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
        <div>Network throughput</div>
        <br />
        <div>
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
                {this.props.networksTxVm
                  .map((currProperty: any) => `vifs_${currProperty}_(tx)`)
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
                {this.props.networksRxVm
                  .map((currProperty: any) => `vifs_${currProperty}_(rx)`)
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={property}
                      stroke={allColors[this.props.networksTxVm.length + index]}
                      fill={allColors[this.props.networksTxVm.length + index]}
                    />
                  ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.networksTxVm
              .map((currProperty: any) => `vifs_${currProperty}_(tx)`)
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
            {this.props.networksRxVm
              .map((currProperty: any) => `vifs_${currProperty}_(rx)`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[this.props.networksTxVm.length + index]}
                  fill={allColors[this.props.networksTxVm.length + index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VmDiskGraph extends Component<any, any> {
  state: any = {
    startIndexDiskVm: 0,
    endIndexDiskVm: 0,
  }

  handleChangeDiskVm = (res: any) => {
    this.setState({ startIndexDiskVm: res.startIndex })
    this.setState({ endIndexDiskVm: res.endIndex })
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
        <div>Disk throughput</div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataVmDisk}
            //syncId='vm'
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
                {this.props.disksW
                  .map((currProperty: any) => `xvds_${currProperty}_(w)`)
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
                {this.props.disksR
                  .map((currProperty: any) => `xvds_${currProperty}_(r)`)
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={property}
                      stroke={allColors[this.props.disksW.length + index]}
                      fill={allColors[this.props.disksW.length + index]}
                    />
                  ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.disksW
              .map((currProperty: any) => `xvds_${currProperty}_(w)`)
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
            {this.props.disksR
              .map((currProperty: any) => `xvds_${currProperty}_(r)`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[this.props.disksW.length + index]}
                  fill={allColors[this.props.disksW.length + index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

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

class SrIOPSGraph extends Component<any, any> {
  state: any = {
    startIndexIopsSR: 0,
    endIndexIopsSR: 0,
  }

  handleChangeIopsSR = (res: any) => {
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
            data={this.props.dataSrIops}
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
                {this.props.iopsSr
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
            {this.props.iopsSr
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

class SrIOThroGraph extends Component<any, any> {
  state: any = {
    startIndexIOSR: 0,
    endIndexIOSR: 0,
  }

  handleChangeIOSR = (res: any) => {
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
            data={this.props.dataSrThro}
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
                {this.props.throSr
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
            {this.props.throSr
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

class SrLatencyGraph extends Component<any, any> {
  state: any = {
    startIndexLatencySR: 0,
    endIndexLatencySR: 0,
  }

  handleChangeLatencySR = (res: any) => {
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
            data={this.props.dataSrLatency}
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
                {this.props.latencySr
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
            {this.props.latencySr
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

class SrIoWaitGraph extends Component<any, any> {
  state: any = {
    startIndexIOwaitSR: 0,
    endIndexIOwaitSR: 0,
  }

  handleChangeIOwaitSR = (res: any) => {
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
                {this.props.iowaitSr
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
            {this.props.iowaitSr
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
