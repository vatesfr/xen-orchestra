import React, { Component } from 'react'
import { YAxis, AreaChart } from 'recharts'
import { getObject, xoCall } from './utils'
import { Area } from 'recharts'
const NB_VALUES = 118
const tabId = [
  '40fec8ff-e0cf-aa79-ad3a-985ef582f10c',
  '402b4559-217c-e9df-53b8-b548c2616e92',
  'ebd131c8-d8df-144a-5997-f1969da1f022',
]

export default class Visualization extends Component<any, any> {
  state: any = {
    vmIds: 0,
  }
  render() {
    return (
      <div>
        <div>
          <VmsDiskStats vmIds={tabId} />
        </div>
        <div>
          <VmsNetworkStats vmIds={tabId} />
        </div>
        <div>
          <VmsMemoryStats vmIds={tabId} />
        </div>
        <div>
          <VmsCpuStats vmIds={tabId} />
        </div>
      </div>
    )
  }
}

const GRAPH_CONFIG = { top: 5, right: 20, left: 90, bottom: 5 }

class VmsCpuStats extends Component<any, any> {
  state: any = {
    vmId: 0,
  }
  render() {
    return this.props.vmIds.map((vmId: any) => (
      <VmCpuStats vmId={vmId} key={vmId} />
    ))
  }
}

class VmCpuStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    cpusVm: [],
    cpuDataVm: [],
  }
  componentDidMount() {
    setInterval(this.fetchCpuVmStats.bind(this), 5e3)
  }

  fetchCpuVmStats = () => {
    xoCall('vm.stats', {
      id: this.props.vmId,
      granularity: this.state.granularity,
    }).then(({ endTimestamp, stats: { cpus }, interval }) => {
      this.setState({ cpusVm: Object.keys(cpus) })

      let cpuDataVm: any[] = []
      const averageCpu: any[] = []
      for (var i = 0; i < NB_VALUES; i++) {
        averageCpu[i] = 0
        for (var j = 0; j < this.state.cpusVm.length; j++) {
          averageCpu[i] += cpus[j][i] / this.state.cpusVm.length
        }
      }
      for (var i = 0; i < NB_VALUES; i++) {
        let valuesCpus: any = {}
        valuesCpus.time = (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
        valuesCpus.cpu = averageCpu[i]

        cpuDataVm.push(valuesCpus)
      }
      this.setState({ cpuDataVm })
    })
  }

  render() {
    return (
      <div>
        <div>CPU usage</div>
        <br />
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.state.cpuDataVm}
            margin={GRAPH_CONFIG}
          >
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: '11px' }}
              tickFormatter={value => value + ' %'}
              hide={true}
            />
            <Area
              isAnimationActive={false}
              type='monotone'
              dataKey='cpu'
              stroke='#e6e600'
              fill='#e6e600'
            />
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VmsMemoryStats extends Component<any, any> {
  state: any = {
    vmId: 0,
  }

  render() {
    return this.props.vmIds.map((vmId: any) => (
      <VmMemoryStats vmId={vmId} key={vmId} />
    ))
  }
}
class VmMemoryStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxMemory: 0,
    dataMemory: [],
  }
  componentDidMount() {
    setInterval(this.fetchStatsVm.bind(this), 5e3)
  }

  fetchStatsVm = () => {
    getObject(this.props.vmId).then((vm: any) => {
      this.setState({ maxMemory: vm.memory.dynamic[1] })
    })

    xoCall('vm.stats', {
      id: this.props.vmId,
      granularity: this.state.granularity,
    }).then(
      ({ endTimestamp, interval, stats: { memory, memoryFree = memory } }) => {
        let newDataMemory: any[] = []
        let dataMemory: any[] = []

        newDataMemory = memoryFree.map(
          (value: any, index: any) => memory[index] - value
        )

        for (var i = 0; i < NB_VALUES; i++) {
          const valuesMemory: any = {}
          valuesMemory.time =
            (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          valuesMemory.memory = newDataMemory[i]
          dataMemory.push(valuesMemory)
        }
        this.setState({
          dataMemory,
        })
      }
    )
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
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.state.dataMemory}
            margin={GRAPH_CONFIG}
          >
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => this.formatBytes(value, 0)}
              domain={[0, this.state.maxMemory]}
              hide={true}
            />
            <Area type='monotone' dataKey='memory' stroke='blue' fill='blue' />
          </AreaChart>
        </div>
        <br />
      </div>
    )
  }
}

class VmsNetworkStats extends Component<any, any> {
  state: any = {
    vmId: 0,
    max: 0,
    allData: [],
  }
  componentDidMount() {
    setInterval(this.fetchAll.bind(this), 5e3)
  }
  fetchAll() {
    Promise.all(this.props.vmIds.map((idVm: any) => this.fetchOne(idVm))).then(
      allData => {
        this.setState({ max: 0 })
        this.setState({ allData: [] })
        allData.forEach((currentVm: any) => {
          this.updateData(
            currentVm.endTimestamp,
            currentVm.interval,
            currentVm.stats
          )
        })
      }
    )
  }

  fetchOne = (idVm: string) =>
    xoCall('vm.stats', {
      id: idVm,
      granularity: this.state.granularity,
    })

  computeMax(value: number) {
    return this.state.max < value ? value : this.state.max
  }

  updateData(endTimestamp: any, interval: any, stats: any) {
    const data: any = {}

    data.networksTransmissionVm = Object.keys(stats.vifs.tx)
    data.networksReceptionVm = Object.keys(stats.vifs.rx)

    let vmNetworkData: any[] = []
    for (var i = 0; i < NB_VALUES; i++) {
      let valuesNetwork: any = {}

      data.networksTransmissionVm.forEach((property: string | number) => {
        const networkValuesTransmission = stats.vifs.tx[property][i]
        if (
          data.maxNetworkT === undefined ||
          networkValuesTransmission > data.maxNetworkT
        ) {
          data.maxNetworkT = networkValuesTransmission
        }
        valuesNetwork[`vifs_${property}_(tx)`] = stats.vifs.tx[property][i]
      })

      data.networksReceptionVm.forEach((property: string | number) => {
        const networkValuesReception = stats.vifs.rx[property][i]
        if (
          data.maxNetworkR === undefined ||
          networkValuesReception > data.maxNetworkR
        ) {
          data.maxNetworkR = networkValuesReception
        }
        valuesNetwork[`vifs_${property}_(rx)`] = stats.vifs.rx[property][i]
      })
      valuesNetwork.time =
        (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
      vmNetworkData.push(valuesNetwork)
    }
    const maxNetwork = Math.max(data.maxNetworkR, data.maxNetworkT)
    data.values = vmNetworkData
    const tmpAllData: any[] = this.state.allData
    tmpAllData.push(data)
    this.setState({ allData: tmpAllData })
    this.setState({ max: this.computeMax(maxNetwork) })
  }

  render() {
    return this.state.allData.map((currentData: any) => (
      <VmNetworkStats max={this.state.max} data={currentData} />
    ))
  }
}

class VmNetworkStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
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
            width={400}
            height={100}
            data={this.props.data.values}
            margin={GRAPH_CONFIG}
          >
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => this.formatBytes(value, 2)}
              domain={[0, Math.max(1, this.props.max)]}
              hide={true}
            />
            {[
              ...this.props.data.networksTransmissionVm,
              ...this.props.data.networksReceptionVm,
            ].map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`vifs_${property}_(${
                  index < this.props.data.networksTransmissionVm.length
                    ? 'tx'
                    : 'rx'
                })`}
                stroke='#66ccff'
                fill='#66ccff'
                key={index}
              />
            ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VmsDiskStats extends Component<any, any> {
  state: any = {
    vmId: 0,
    max: 0,
    allData: [],
  }

  componentDidMount() {
    setInterval(this.fetchAll.bind(this), 5e3)
  }

  fetchAll() {
    Promise.all(this.props.vmIds.map((idVm: any) => this.fetchOne(idVm))).then(
      allData => {
        this.setState({ max: 0 })
        this.setState({ allData: [] })
        allData.forEach((currentVm: any) => {
          this.updateData(
            currentVm.endTimestamp,
            currentVm.interval,
            currentVm.stats
          )
        })
      }
    )
  }

  fetchOne = (idVm: string) =>
    xoCall('vm.stats', {
      id: idVm,
      granularity: this.state.granularity,
    })

  computeMax(value: number) {
    return this.state.max < value ? value : this.state.max
  }
  updateData(endTimestamp: any, interval: any, stats: any) {
    const data: any = {}
    data.disksWriting = Object.keys(stats.xvds.w)
    data.disksReading = Object.keys(stats.xvds.r)

    let diskDataVm: any[] = []

    for (var i = 0; i < NB_VALUES; i++) {
      let ValuesDisk: any = {}

      data.disksWriting.forEach((property: string | number) => {
        const diskValuesWriting = stats.xvds.w[property][i]

        if (data.maxDiskW === undefined || diskValuesWriting > data.maxDiskW) {
          data.maxDiskW = diskValuesWriting
        }
        ValuesDisk[`xvds_${property}_(w)`] = stats.xvds.w[property][i]
      })

      data.disksReading.forEach((property: string | number) => {
        const diskValuesReading = stats.xvds.r[property][i]

        if (data.maxDiskR === undefined || diskValuesReading > data.maxDiskR) {
          data.maxDiskR = diskValuesReading
        }

        ValuesDisk[`xvds_${property}_(r)`] = stats.xvds.r[property][i]
      })

      ValuesDisk.time = (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
      diskDataVm.push(ValuesDisk)
    }

    const maxDisk = Math.max(data.maxDiskW, data.maxDiskR)
    data.values = diskDataVm
    const tmpAllData: any[] = this.state.allData
    tmpAllData.push(data)
    this.setState({ allData: tmpAllData })
    this.setState({ max: this.computeMax(maxDisk) })
  }

  render() {
    return this.state.allData.map((currentData: any) => (
      <VmDiskStats max={this.state.max} data={currentData} />
    ))
  }
}

class VmDiskStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
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
            width={400}
            height={100}
            data={this.props.data.values}
            syncId='vm'
            margin={GRAPH_CONFIG}
          >
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => this.formatBytes(value, 2)}
              domain={[0, Math.max(1, this.props.max)]}
              hide={true}
            />
            {[
              ...this.props.data.disksWriting,
              ...this.props.data.disksReading,
            ].map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`xvds_${property}_(${
                  index < this.props.data.disksWriting.length ? 'w' : 'r'
                })`}
                stroke='#006666'
                fill='#006666'
              />
            ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}
