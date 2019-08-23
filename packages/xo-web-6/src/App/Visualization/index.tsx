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

import { allColors, getObject, xoCall } from './utils'
import moment from 'moment'
const NB_VALUES = 118

export default class Visualization extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    //  VM
    //  Cpu
    vmCpuData: [],
    vmCpus: [],

    //  Memory
    vmMemoryData: [],
    memoryMaxVm: 0,

    //  Network
    vmNetworkData: [],
    networksTransmissionVm: [],
    networksReceptionVm: [],
    maxNetworkVm: 0,

    //  Disk
    vmDiskData: [],
    disksWriting: [],
    disksReading: [],
    maxDisk: 0,
  }

  componentDidMount() {
    setInterval(this.fetchVmStats.bind(this), 5e3)
  }

  fetchVmStats = () => {
    getObject('e4b49f04-e7dd-d5f9-e14a-0842d6af84fe').then((vm: any) => {
      this.setState({ memoryMaxVm: vm.memory.dynamic[1] })
    })

    xoCall('vm.stats', {
      id: 'e4b49f04-e7dd-d5f9-e14a-0842d6af84fe',
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

        this.setState({ vmCpus: Object.keys(cpus) })
        this.setState({ networksTransmissionVm: Object.keys(vifs.tx) })
        this.setState({ networksReceptionVm: Object.keys(vifs.rx) })
        this.setState({ disksWriting: Object.keys(xvds.w) })
        this.setState({ disksReading: Object.keys(xvds.r) })

        let vmCpuData: any[] = []
        let vmMemoryData: any[] = []
        let vmNetworkData: any[] = []
        let vmDiskData: any[] = []
        let newDataMemory: any[] = []

        newDataMemory = memoryFree.map(
          (value: any, index: any) => memory[index] - value
        )

        for (var i = 0; i < NB_VALUES; i++) {
          let valuesCpus: any = {}
          let valuesMemory: any = {}
          let valuesNetwork: any = {}
          let ValuesDisk: any = {}

          valuesCpus.time = moment(
            (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          ).format(format)

          this.state.vmCpus.forEach((property: string | number) => {
            valuesCpus[`cpu${property}`] = cpus[property][i]
          })

          this.state.networksTransmissionVm.forEach(
            (property: string | number) => {
              valuesNetwork[`vifs_${property}_(tx)`] = vifs.tx[property][i]
            }
          )

          this.state.networksReceptionVm.forEach(
            (property: string | number) => {
              valuesNetwork[`vifs_${property}_(rx)`] = vifs.rx[property][i]
            }
          )

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
          vmDiskData.push(ValuesDisk)
          vmCpuData.push(valuesCpus)
          vmNetworkData.push(valuesNetwork)
          vmMemoryData.push(valuesMemory)
        }

        this.state.networksTransmissionVm.forEach(
          (property: string | number) => {
            this.setState({ maxNetworkTx: Math.max(...vifs.tx[property]) })
          }
        )

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
        this.setState({ vmCpuData, vmMemoryData, vmNetworkData, vmDiskData })
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
            <select
              onChange={this.setGranularity}
              value={this.state.granularity}
            >
              <option value='seconds'>Last 10 minutes</option>
              <option value='minutes'>Last 2 hours</option>
              <option value='hours'>Last week</option>
              <option value='days'>Last year</option>
            </select>
          </form>
        </div>
        <CpuVmGraph
          vmCpuData={this.state.vmCpuData}
          vmCpus={this.state.vmCpus}
        />
        <MemoryVmGraph
          vmMemoryData={this.state.vmMemoryData}
          memoryMaxVm={this.state.memoryMaxVm}
        />
        <NetworkVmGraph
          vmNetworkData={this.state.vmNetworkData}
          networksTransmissionVm={this.state.networksTransmissionVm}
          networksReceptionVm={this.state.networksReceptionVm}
          maxNetworkVm={this.state.maxNetworkVm}
        />
        <DiskVmGraph
          vmDiskData={this.state.vmDiskData}
          disksWriting={this.state.disksWriting}
          disksReading={this.state.disksReading}
          maxDisk={this.state.maxDisk}
        />
      </div>
    )
  }
}

const GRAPH_CONFIG = { top: 5, right: 20, left: 90, bottom: 5 }

class CpuVmGraph extends Component<any, any> {
  state: any = {
    startIndexCpuVm: 0,
    endIndexCpuVm: 0,
  }

  handleVmCpuZoomChange = (res: any) => {
    this.setState({
      startIndexCpuVm: res.startIndex,
      endIndexCpuVm: res.endIndex,
    })
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
            data={this.props.vmCpuData}
            syncId='vm'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              domain={[0, 100*this.props.vmCpus.length]}
              tick={{ fontSize: '11px' }}
              tickFormatter={value => value + ' %'}
            />
            <Tooltip />
            <Brush
              onChange={this.handleVmCpuZoomChange}
              startIndex={this.state.startIndexCpuVm}
              endIndex={this.state.endIndexCpuVm}
            >
              <AreaChart
                width={830}
                height={350}
                data={this.props.vmCpuData}
                margin={GRAPH_CONFIG}
              >
                {this.props.vmCpus.map((property: any, index: any) => (
                  <Area
                    connectNulls
                    isAnimationActive={false}
                    type='monotone'
                    dataKey={`cpu${property}`}
                    stroke={allColors[index]}
                    fill={allColors[index]}
                    key={index}
                    stackId="3"
                  />
                ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {this.props.vmCpus.map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`cpu${property}`}
                stroke={allColors[index]}
                fill={allColors[index]}
                key={index}
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

  handleVmMemoryZoomChange = (res: any) => {
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
            data={this.props.vmMemoryData}
            syncId='vm'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => this.formatBytes(value, 0)}
              domain={[0, this.props.memoryMaxVm]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleVmMemoryZoomChange}
              startIndex={this.state.startIndexMemoryVm}
              endIndex={this.state.endIndexMemoryVm}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.vmMemoryData}
                margin={GRAPH_CONFIG}
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

  handleVmNetworkZoomChange = (res: any) => {
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
            data={this.props.vmNetworkData}
            syncId='vm'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => this.formatBytes(value, 2)}
              domain={[0, Math.max(1024e3, this.props.maxNetworkVm)]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleVmNetworkZoomChange}
              startIndex={this.state.startIndexNetworkVm}
              endIndex={this.state.endIndexNetworkVm}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.vmNetworkData}
                margin={GRAPH_CONFIG}
              >
                {[
                  ...this.props.networksTransmissionVm,
                  ...this.props.networksReceptionVm,
                ].map((property: any, index: any) => (
                  <Area
                    connectNulls
                    isAnimationActive={false}
                    type='monotone'
                    dataKey={`vifs_${property}_(${
                      index < this.props.networksTransmissionVm.length
                        ? 'tx'
                        : 'rx'
                    })`}
                    stroke={allColors[index]}
                    fill={allColors[index]}
                    key={index}
                  />
                ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {[
              ...this.props.networksTransmissionVm,
              ...this.props.networksReceptionVm,
            ].map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`vifs_${property}_(${
                  index < this.props.networksTransmissionVm.length ? 'tx' : 'rx'
                })`}
                stroke={allColors[index]}
                fill={allColors[index]}
                key={index}
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

  handleVMDiskZoomChange = (res: any) => {
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
            data={this.props.vmDiskData}
            syncId='vm'
            margin={GRAPH_CONFIG}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value => this.formatBytes(value, 2)}
              domain={[0, Math.max(1024e6, this.props.maxDisk)]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleVMDiskZoomChange}
              startIndex={this.state.startIndexDiskVm}
              endIndex={this.state.endIndexDiskVm}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.state.vmDiskData}
                margin={GRAPH_CONFIG}
              >
                {[...this.props.disksWriting, ...this.props.disksReading].map(
                  (property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={`xvds_${property}_(${
                        index < this.props.disksWriting.length ? 'w' : 'r'
                      })`}
                      stroke={allColors[index]}
                      fill={allColors[index]}
                      key={index}
                    />
                  )
                )}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {[...this.props.disksWriting, ...this.props.disksReading].map(
              (property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={`xvds_${property}_(${
                    index < this.props.disksWriting.length ? 'w' : 'r'
                  })`}
                  stroke={allColors[index]}
                  fill={allColors[index]}
                  key={index}
                />
              )
            )}
          </AreaChart>
        </div>
      </div>
    )
  }
}
