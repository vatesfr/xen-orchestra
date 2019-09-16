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
import humanFormat from 'human-format'
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
    vmMemoryMax: 0,

    //  Network
    vmNetworkData: [],
    vmNetworksTransmission: [],
    vmNetworksReception: [],
    vmNetworkMax: 0,

    //  Disk
    vmDiskData: [],
    vmDisksWriting: [],
    vmDisksReading: [],
    vmDiskMax: 0,
  }

  componentDidMount() {
    setInterval(this.fetchVmStats.bind(this), 5e3)
  }

  fetchVmStats = () => {
    getObject('402b4559-217c-e9df-53b8-b548c2616e92').then((vm: any) => {
      this.setState({ vmMemoryMax: vm.memory.dynamic[1] })
    })

    xoCall('vm.stats', {
      id: '402b4559-217c-e9df-53b8-b548c2616e92',
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
        this.setState({ vmNetworksTransmission: Object.keys(vifs.tx) })
        this.setState({ vmNetworksReception: Object.keys(vifs.rx) })
        this.setState({ vmDisksWriting: Object.keys(xvds.w) })
        this.setState({ vmDisksReading: Object.keys(xvds.r) })
        let vmCpuData: any[] = []
        let vmMemoryData: any[] = []
        let vmNetworkData: any[] = []
        let vmDiskData: any[] = []
        let vmMemoryNewData: any[] = []

        vmMemoryNewData = memoryFree.map(
          (value: any, index: any) => memory[index] - value
        )

        for (var i = 0; i < NB_VALUES; i++) {
          let vmCpusValues: any = {}
          let vmMemoryValues: any = {}
          let vmNetworkValues: any = {}
          let vmDiskValues: any = {}

          vmCpusValues.time = moment(
            (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          ).format(format)

          this.state.vmCpus.forEach((property: string | number) => {
            vmCpusValues[`cpu${property}`] = cpus[property][i]
          })

          this.state.vmNetworksTransmission.forEach(
            (property: string | number) => {
              vmNetworkValues[`vifs_${property}_(tx)`] = vifs.tx[property][i]
            }
          )

          this.state.vmNetworksReception.forEach(
            (property: string | number) => {
              vmNetworkValues[`vifs_${property}_(rx)`] = vifs.rx[property][i]
            }
          )

          this.state.vmDisksWriting.forEach((property: string | number) => {
            vmDiskValues[`xvds_${property}_(w)`] = xvds.w[property][i]
          })

          this.state.vmDisksReading.forEach((property: string | number) => {
            vmDiskValues[`xvds_${property}_(r)`] = xvds.r[property][i]
          })

          vmMemoryValues.memory = vmMemoryNewData[i]
          vmMemoryValues.time = vmCpusValues.time
          vmNetworkValues.time = vmCpusValues.time
          vmDiskValues.time = vmCpusValues.time
          vmDiskData.push(vmDiskValues)
          vmCpuData.push(vmCpusValues)
          vmNetworkData.push(vmNetworkValues)
          vmMemoryData.push(vmMemoryValues)
        }

        this.state.vmNetworksTransmission.forEach(
          (property: string | number) => {
            this.setState({ maxNetworkTx: Math.max(...vifs.tx[property]) })
          }
        )

        this.state.vmNetworksReception.forEach((property: string | number) => {
          this.setState({ maxNetworkRx: Math.max(...vifs.rx[property]) })
        })

        this.state.vmNetworkMax = Math.max(
          this.state.maxNetworkTx,
          this.state.maxNetworkRx
        )

        this.state.vmDisksWriting.forEach((property: string | number) => {
          this.setState({ maxDiskW: Math.max(...xvds.w[property]) })
        })

        this.state.vmDisksReading.forEach((property: string | number) => {
          this.setState({ maxDiskR: Math.max(...xvds.r[property]) })
        })

        this.state.vmDiskMax = Math.max(
          this.state.maxDiskW,
          this.state.maxDiskR
        )
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
        <VmCpuGraph
          vmCpuData={this.state.vmCpuData}
          vmCpus={this.state.vmCpus}
        />
        <VmMemoryGraph
          vmMemoryData={this.state.vmMemoryData}
          vmMemoryMax={this.state.vmMemoryMax}
        />
        <VmNetworkGraph
          vmNetworkData={this.state.vmNetworkData}
          vmNetworksTransmission={this.state.vmNetworksTransmission}
          vmNetworksReception={this.state.vmNetworksReception}
          vmNetworkMax={this.state.vmNetworkMax}
        />
        <VmDiskGraph
          vmDiskData={this.state.vmDiskData}
          vmDisksWriting={this.state.vmDisksWriting}
          vmDisksReading={this.state.vmDisksReading}
          vmDiskMax={this.state.vmDiskMax}
        />
      </div>
    )
  }
}

const GRAPH_CONFIG = { top: 5, right: 20, left: 90, bottom: 5 }

class VmCpuGraph extends Component<any, any> {
  state: any = {
    vmCpuStartIndex: 0,
    vmCpuEndIndex: 0,
  }

  handleVmCpuZoomChange = (res: any) => {
    this.setState({
      vmCpuStartIndex: res.startIndex,
      vmCpuEndIndex: res.endIndex,
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
              domain={[0, 100]}
              tick={{ fontSize: '11px' }}
              tickFormatter={value => value + ' %'}
            />
            <Tooltip />
            <Brush
              onChange={this.handleVmCpuZoomChange}
              startIndex={this.state.vmCpuStartIndex}
              endIndex={this.state.vmCpuEndIndex}
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

class VmMemoryGraph extends Component<any, any> {
  state: any = {
    startIndexMemoryVm: 0,
    endIndexMemoryVm: 0,
  }

  handleVmMemoryZoomChange = (res: any) => {
    this.setState({ startIndexMemoryVm: res.startIndex })
    this.setState({ endIndexMemoryVm: res.endIndex })
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
              tickFormatter={value =>
                humanFormat(value, { scale: 'binary', unit: 'B' })
              }
              domain={[0, this.props.vmMemoryMax]}
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

class VmNetworkGraph extends Component<any, any> {
  state: any = {
    startIndexNetworkVm: 0,
    endIndexNetworkVm: 0,
  }

  handleVmNetworkZoomChange = (res: any) => {
    this.setState({ startIndexNetworkVm: res.startIndex })
    this.setState({ endIndexNetworkVm: res.endIndex })
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
              tickFormatter={value =>
                humanFormat(value, { scale: 'binary', unit: 'B' })
              }
              domain={[0, Math.max(1024e3, this.props.vmNetworkMax)]}
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
                  ...this.props.vmNetworksTransmission,
                  ...this.props.vmNetworksReception,
                ].map((property: any, index: any) => (
                  <Area
                    connectNulls
                    isAnimationActive={false}
                    type='monotone'
                    dataKey={`vifs_${property}_(${
                      index < this.props.vmNetworksTransmission.length
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
              ...this.props.vmNetworksTransmission,
              ...this.props.vmNetworksReception,
            ].map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`vifs_${property}_(${
                  index < this.props.vmNetworksTransmission.length ? 'tx' : 'rx'
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

class VmDiskGraph extends Component<any, any> {
  state: any = {
    startIndexDiskVm: 0,
    endIndexDiskVm: 0,
  }

  handleVMDiskZoomChange = (res: any) => {
    this.setState({ startIndexDiskVm: res.startIndex })
    this.setState({ endIndexDiskVm: res.endIndex })
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
              tickFormatter={value =>
                humanFormat(value, { scale: 'binary', unit: 'B' })
              }
              domain={[0, Math.max(1024e6, this.props.vmDiskMax)]}
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
                {[
                  ...this.props.vmDisksWriting,
                  ...this.props.vmDisksReading,
                ].map((property: any, index: any) => (
                  <Area
                    connectNulls
                    isAnimationActive={false}
                    type='monotone'
                    dataKey={`xvds_${property}_(${
                      index < this.props.vmDisksWriting.length ? 'w' : 'r'
                    })`}
                    stroke={allColors[index]}
                    fill={allColors[index]}
                    key={index}
                  />
                ))}
              </AreaChart>
            </Brush>
            <Legend iconType='rect' iconSize={18} />
            {[...this.props.vmDisksWriting, ...this.props.vmDisksReading].map(
              (property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={`xvds_${property}_(${
                    index < this.props.vmDisksWriting.length ? 'w' : 'r'
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
