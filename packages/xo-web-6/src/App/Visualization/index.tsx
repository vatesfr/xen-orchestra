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
    //  VM
    //  Cpu
    cpuDataVm: [],
    cpusVm: [],

    //  Memory
    memoryDataVm: [],
    memoryMaxVm: 0,

    //  Network
    networkDataVm: [],
    networksTransmissionVm: [],
    networksReceptionVm: [],
    maxNetworkVm: 0,

    //  Disk
    diskDataVm: [],
    disksWriting: [],
    disksReading: [],
    maxDisk: 0,
  }

  componentDidMount() {
    setInterval(this.fetchVmStats.bind(this), 5e3)
  }

  fetchVmStats = () => {
    getObject('28851ef6-951c-08bc-a5be-8898e2a31b7a').then((vm: any) => {
      this.setState({ memoryMaxVm: vm.memory.dynamic[1] })
    })

    xoCall('vm.stats', {
      id: '28851ef6-951c-08bc-a5be-8898e2a31b7a',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        stats: { cpus },
        interval,
        stats: { memory, memoryFree = memory },
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

        this.setState({ networksTransmissionVm: Object.keys(vifs.tx) })
        this.setState({ networksReceptionVm: Object.keys(vifs.rx) })

        this.setState({ disksWriting: Object.keys(xvds.w) })
        this.setState({ disksReading: Object.keys(xvds.r) })

        let cpuDataVm: any[] = []
        let memoryDataVm: any[] = []
        let networkDataVm: any[] = []
        let diskDataVm: any[] = []
        let newDataMemory: any[] = []

        newDataMemory = memoryFree.map(
          (value: any, index: any) => memory[index] - value)   

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

          this.state.networksTransmissionVm.forEach((property: string | number) => {
            valuesNetwork[`vifs_${property}_(tx)`] = vifs.tx[property][i]
          })

          this.state.networksReceptionVm.forEach((property: string | number) => {
            valuesNetwork[`vifs_${property}_(rx)`] = vifs.rx[property][i]
          })

          this.state.disksWriting.forEach((property: string | number) => {
            ValuesDisk[`xvds_${property}_(w)`] = xvds.w[property][i]
          })

          this.state.disksReading.forEach((property: string | number) => {
            ValuesDisk[`xvds_${property}_(r)`] = xvds.r[property][i]
          })

          valuesMemory.memory = newDataMemory[i]
          valuesMemory.time = valuesCpus.time
          valuesNetwork.time = valuesCpus.time
          ValuesDisk.time = valuesCpus.time
          diskDataVm.push(ValuesDisk)
          cpuDataVm.push(valuesCpus)
          networkDataVm.push(valuesNetwork)
          memoryDataVm.push(valuesMemory)
        }
       

        this.state.networksTransmissionVm.forEach((property: string | number) => {
          this.setState({ maxNetworkTx: Math.max(...vifs.tx[property]) })
        })

        this.state.networksReceptionVm.forEach((property: string | number) => {
          this.setState({ maxNetworkRx: Math.max(...vifs.rx[property]) })
        })

        this.state.maxNetworkVm = Math.max(
          this.state.maxNetworkTx,
          this.state.maxNetworkRx
        )

        this.state.disksWriting.forEach((property: string | number) => {
          this.setState({ maxDiskW: Math.max(...xvds.w[property]) })
        })

        this.state.disksReading.forEach((property: string | number) => {
          this.setState({ maxDiskR: Math.max(...xvds.r[property]) })
        })

        this.state.maxDisk = Math.max(this.state.maxDiskW, this.state.maxDiskR)
        this.setState({ cpuDataVm, memoryDataVm, networkDataVm, diskDataVm })
      }
    )
  }

  setGranularity = (event: any) => {
    this.setState({ granularity: event.target.value }, () => {
      this.fetchVmStats()
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
        <CpuVmGraph
          cpuDataVm={this.state.cpuDataVm}
          cpusVm={this.state.cpusVm}
        />
        <MemoryVmGraph
          memoryDataVm={this.state.memoryDataVm}
          memoryMaxVm={this.state.memoryMaxVm}
        />
        <NetworkVmGraph
          networkDataVm={this.state.networkDataVm}
          networksTransmissionVm={this.state.networksTransmissionVm}
          networksReceptionVm={this.state.networksReceptionVm}
          maxNetworkVm={this.state.maxNetworkVm}
        />
        <DiskVmGraph
          diskDataVm={this.state.diskDataVm}
          disksWriting={this.state.disksWriting}
          disksReading={this.state.disksReading}
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

class CpuVmGraph extends Component<any, any> {
  state: any = {
    startIndexCpuVm: 0,
    endIndexCpuVm: 0,
  }

  handleChangeCpuVm = (res: any) => {
    this.setState({ startIndexCpuVm: res.startIndex,endIndexCpuVm: res.endIndex })
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
            data={this.props.cpuDataVm}
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
                data={this.props.cpuDataVm}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
               {this.props.cpusVm
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
            {this.props.cpusVm
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
        </div>
      </div>
    )
  }
}

class MemoryVmGraph extends Component<any, any> {
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
            data={this.props.memoryDataVm}
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
              domain={[0, this.props.memoryMaxVm]}
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
                data={this.props.memoryDataVm}
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

class NetworkVmGraph extends Component<any, any> {
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
            data={this.props.networkDataVm}
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
              domain={[0, Math.max(1000000, this.props.maxNetworkVm)]}
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
                data={this.props.networkDataVm}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {[ ...this.props.networksTransmissionVm, ...this.props.networksReceptionVm]
                  .map((property: any, index: any) => (  
                    <Area                                 
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={`vifs_${property}_(${index < this.props.networksTransmissionVm.length ? 'tx' : 'rx'})`}
                      stroke={allColors[index]}
                      fill={allColors[index]}
                    />
                  ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {[ ...this.props.networksTransmissionVm, ...this.props.networksReceptionVm]
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={`vifs_${property}_(${index < this.props.networksTransmissionVm.length ? 'tx' : 'rx'})`}
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

class DiskVmGraph extends Component<any, any> {
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
            data={this.props.diskDataVm}
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
                data={this.state.diskDataVm}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
               {[ ...this.props.disksWriting, ...this.props.disksReading]
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={`xvds_${property}_(${index < this.props.disksWriting.length ? 'w' : 'r'})`}
                      stroke={allColors[index]}
                      fill={allColors[index]}
                    />
                  ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />

            {[ ...this.props.disksWriting, ...this.props.disksReading]
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={`xvds_${property}_(${index < this.props.disksWriting.length ? 'w' : 'r'})`}
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

////// .map((property: any, index: any) => ( //// dataKey={`vifs_${property}_(${index < this.props.networksTransmissionVm.length ? 'tx' : 'rx'})`}