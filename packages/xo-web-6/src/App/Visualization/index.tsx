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
  }

  componentDidMount() {
    setInterval(this.fetchVmStats.bind(this), 5e3)
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

  setTime = (event: any) => {
    this.setState({ granularity: event.target.value }, () => {
      this.fetchVmStats()
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
