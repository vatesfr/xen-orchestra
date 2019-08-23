import React, { Component } from 'react'
import { YAxis, AreaChart, Legend, XAxis } from 'recharts'
import Xo from 'xo-lib'

import { Area } from 'recharts'
import { getObject, xoCall } from './utils'
const NB_VALUES = 118
const tabId = [
  'b54bf91f-51d7-4af5-b1b3-f14dcf1146ee',
  '139efd4b-5544-4f83-9090-a93d351dffbe',
  '73bb5ce0-f720-4621-bd68-98341b094bad',
]

export default class Visualization extends Component<any, any> {
  state: any = {
    hostIds: 0,
  }
  render() {
    return (
      <div>
        <div>
          <HostsMemoryStats hostIds={tabId} />
        </div>
        <div>
          <HostsCpuStats hostIds={tabId} />
        </div>
        <div>
          <HostsNetworkStats hostIds={tabId} />
        </div>
        <div>
          <HostsLoadStats hostIds={tabId} />
        </div>
      </div>
    )
  }
}
const GRAPH_CONFIG = { top: 5, right: 20, left: 90, bottom: 5 }
class HostsMemoryStats extends Component<any, any> {
  state: any = {
    hostId: 0,
  }
  render() {
    return this.props.hostIds.map((hostId: any) => (
      <HostMemoryStats hostId={hostId} key={hostId} />
    ))
  }
}

class HostsCpuStats extends Component<any, any> {
  state: any = {
    hostId: 0,
  }
  render() {
    return this.props.hostIds.map((hostId: any) => (
      <HostCpuStats hostId={hostId} key={hostId} />
    ))
  }
}

class HostsNetworkStats extends Component<any, any> {
  state: any = {
    hostId: 0,
    max: 0,
    allData: [],
  }

  componentDidMount() {
    setInterval(this.fetchAll.bind(this), 5e3)
  }
  fetchAll() {
    Promise.all(
      this.props.hostIds.map((idVm: any) => this.fetchOne(idVm))
    ).then(allData => {
      this.setState({ max: 0 })
      this.setState({ allData: [] })
      allData.forEach((currentVm: any) => {
        this.updateData(
          currentVm.endTimestamp,
          currentVm.interval,
          currentVm.stats
        )
      })
    })
  }

  fetchOne = (idVm: string) =>
    xoCall('host.stats', {
      host: idVm,
      granularity: this.state.granularity,
    })

  computeMax(value: number) {
    return this.state.max < value ? value : this.state.max
  }
  updateData(endTimestamp: any, interval: any, stats: any) {
    const data: any = {}
    data.networksTransmissionVm = Object.keys(stats.pifs.tx)
    data.networksReceptionVm = Object.keys(stats.pifs.rx)

    let networkDataVm: any[] = []

    for (var i = 0; i < NB_VALUES; i++) {
      let valuesNetwork: any = {}

      data.networksTransmissionVm.forEach((property: string | number) => {
        const networkValuesTransmission = stats.pifs.tx[property][i]
        if (
          data.maxNetworkT === undefined ||
          networkValuesTransmission > data.maxNetworkT
        ) {
          data.maxNetworkT = networkValuesTransmission
        }
        valuesNetwork[`pifs_${property}_(tx)`] = stats.pifs.tx[property][i]
      })

      data.networksReceptionVm.forEach((property: string | number) => {
        const networkValuesReception = stats.pifs.rx[property][i]
        if (
          data.maxNetworkR === undefined ||
          networkValuesReception > data.maxNetworkR
        ) {
          data.maxNetworkR = networkValuesReception
        }
        valuesNetwork[`pifs_${property}_(rx)`] = stats.pifs.rx[property][i]
      })

      valuesNetwork.time =
        (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
      networkDataVm.push(valuesNetwork)
    }
    const maxNetwork = Math.max(data.maxNetworkR, data.maxNetworkT)
    data.values = networkDataVm
    const tmpAllData: any[] = this.state.allData
    tmpAllData.push(data)
    this.setState({ allData: tmpAllData })
    this.setState({ max: this.computeMax(maxNetwork) })
  }
  render() {
    return this.state.allData.map((currentData: any) => (
      <HostNetworkStats max={this.state.max} data={currentData} />
    ))
  }
}

class HostsLoadStats extends Component<any, any> {
  state: any = {
    hostId: 0,
    max: 0,
    allData: [],
  }

  componentDidMount() {
    setInterval(this.fetchAll.bind(this), 5e3)
  }
  fetchAll() {
    Promise.all(
      this.props.hostIds.map((idVm: any) => this.fetchOne(idVm))
    ).then(allData => {
      this.setState({ max: 0 })
      this.setState({ allData: [] })
      allData.forEach((currentVm: any) => {
        this.updateData(
          currentVm.endTimestamp,
          currentVm.interval,
          currentVm.stats
        )
      })
    })
  }

  fetchOne = (idVm: string) =>
    xoCall('host.stats', {
      host: idVm,
      granularity: this.state.granularity,
    })

  computeMax(value: number) {
    return this.state.max < value ? value : this.state.max
  }

  updateData(endTimestamp: any, interval: any, stats: any) {
    const data: any = {}
    let loadDataHost: any[] = []
    for (var i = 0; i < NB_VALUES; i++) {
      let valuesLoad: any = {}
      valuesLoad.load = stats.load[i]
      valuesLoad.time = (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
      loadDataHost.push(valuesLoad)
    }
    
    data.values = loadDataHost
    const maxLoad = Math.max(...stats.load)
    const tmpAllData: any[] = this.state.allData
    tmpAllData.push(data)
    this.setState({ allData: tmpAllData })
    this.setState({ max: this.computeMax(maxLoad) })
  }

  render() {
    return this.state.allData.map((currentData: any) => (
      <HostLoadStats max={this.state.max} data={currentData} />
    ))
  }
}

class HostMemoryStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxMemoryHost: 0,
    dataMemory: [],
  }
  componentDidMount() {
    setInterval(this.fetchStatsHost.bind(this), 5e3)
  }

  fetchStatsHost = () => {
    getObject(this.props.hostId).then((host: any) => {
      this.setState({ maxMemoryHost: host.memory.size })
    })
    xoCall('host.stats', {
      host: this.props.hostId,
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
            <Legend iconType='rect' iconSize={10} />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => this.formatBytes(tick, 0)}
              domain={[0, this.state.maxMemoryHost]}
            />
            <Area
              type='monotone'
              dataKey='memory'
              stroke='#ADD83B'
              fill='#ADD83B'
            />
          </AreaChart>
        </div>
        <br />
      </div>
    )
  }
}

class HostCpuStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    cpusVm: [],
    cpuDataVm: [],
    dataCpu: [],
  }
  componentDidMount() {
    setInterval(this.fetchVmStats.bind(this), 5e3)
  }

  fetchVmStats = () => {
    xoCall('host.stats', {
      host: this.props.hostId,
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
            syncId='vm'
            margin={GRAPH_CONFIG}
          >
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => tick + ' %'}
            />
            <Legend iconType='rect' iconSize={10} />
            <Area
              connectNulls
              isAnimationActive={false}
              type='monotone'
              dataKey='cpu'
              stroke='#015b00'
              fill='#015b00'
            />
          </AreaChart>
        </div>
      </div>
    )
  }
}

class HostNetworkStats extends Component<any, any> {
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
            width={430}
            height={130}
            data={this.props.data.values}
            margin={GRAPH_CONFIG}
          >
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => this.formatBytes(tick, 2)}
              domain={[0, Math.max(100, this.props.max)]}
            />
            <Legend iconType='rect' iconSize={10} />
            {[
              ...this.props.data.networksTransmissionVm,
              ...this.props.data.networksReceptionVm,
            ].map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`pifs_${property}_(${
                  index < this.props.data.networksTransmissionVm.length
                    ? 'tx'
                    : 'rx'
                })`}
                stroke='#493BD8'
                fill='#493BD8'
              />
            ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class HostLoadStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
  }

  render() {
    return (
      <div>
        <div>Load average </div>
        <br />
        <div>
          <AreaChart
            width={430}
            height={100}
            data={this.props.data.values}
            margin={GRAPH_CONFIG}
          >
            <YAxis
              tick={{ fontSize: '11px' }}
              domain={[0, Math.max(1, this.props.max)]}
            />
            <Legend iconType='rect' iconSize={10} />
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
