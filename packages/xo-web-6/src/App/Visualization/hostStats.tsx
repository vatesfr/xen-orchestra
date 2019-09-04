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
import moment from 'moment'
import { allColors, getObject, xoCall } from './utils'
import humanFormat from 'human-format'
const NB_VALUES = 118

export default class Visualization extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',

    //  Host
    //  cpu
    hostCpuData: [],
    cpusHost: [],

    // Memory
    hostMemoryData: [],
    memoryMaxHost: 0,

    //  Network
    hostNetworkData: [],
    networksRxHost: [],
    networksTransmissionHost: [],
    networksReceptionHost: [],

    //  Load
    hostLoadData: [],
    maxLoad: 0,
  }

  componentDidMount() {
    setInterval(this.fetchHostStats.bind(this), 5e3)
  }

  fetchHostStats = () => {
    getObject('b54bf91f-51d7-4af5-b1b3-f14dcf1146ee').then((host: any) => {
      this.setState({ memoryMaxHost: host.memory.size })
    })

    xoCall('host.stats', {
      host: 'b54bf91f-51d7-4af5-b1b3-f14dcf1146ee',
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

        this.setState({
          cpusHost: Object.keys(cpus),
          networksRxHost: Object.keys(pifs.rx),
          networksTransmissionHost: Object.keys(pifs.tx),
        })
        let hostCpuData: any[] = []

        let hostMemoryData: any[] = []
        let hostNetworkData: any[] = []
        let hostLoadData: any[] = []
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

          this.state.networksTransmissionHost.forEach(
            (property: string | number) => {
              valuesHostNetwork[`pifs_${property}_(tx)`] = pifs.tx[property][i]
            }
          )

          valuesLoad.load = load[i]
          valuesHostMemory.memory = newDataMemory[i]
          valuesHostMemory.time = valuesHost.time
          valuesHostNetwork.time = valuesHost.time
          valuesLoad.time = valuesHost.time
          hostCpuData.push(valuesHost)
          hostNetworkData.push(valuesHostNetwork)
          hostLoadData.push(valuesLoad)
          hostMemoryData.push(valuesHostMemory)
        }
        this.setState({ maxLoad: Math.max(...load) })
        this.state.networksTransmissionHost.forEach(
          (property: string | number) => {
            this.setState({ maxNetworkTx: Math.max(...pifs.tx[property]) })
          }
        )

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
          hostCpuData,
          hostMemoryData,
          hostNetworkData,
          hostLoadData,
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

        <CpuHostGraph
          hostCpuData={this.state.hostCpuData}
          cpusHost={this.state.cpusHost}
        />
        <MemoryHostGraph
          hostMemoryData={this.state.hostMemoryData}
          memoryMaxHost={this.state.memoryMaxHost}
        />
        <NetworkHostGraph
          hostNetworkData={this.state.hostNetworkData}
          networksRxHost={this.state.networksRxHost}
          networksTransmissionHost={this.state.networksTransmissionHost}
          networksReceptionHost={this.state.networksReceptionHost}
        />
        <LoadHostGraph
          hostLoadData={this.state.hostLoadData}
          maxLoad={this.state.maxLoad}
        />
      </div>
    )
  }
}

class CpuHostGraph extends Component<any, any> {
  state = {
    startIndexCpuHost: 0,
    endIndexCpuHost: 0,
  }

  handleHostCpuZoomChange = (res: any) => {
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
            data={this.props.hostCpuData}
            syncId='host'
            margin={GRAPH_CONIF}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: '11px' }}
              tickFormatter={value => value + '%'}
            />
            <Tooltip />
            <Brush
              onChange={this.handleHostCpuZoomChange}
              startIndex={this.state.startIndexCpuHost}
              endIndex={this.state.endIndexCpuHost}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.hostCpuData}
                margin={GRAPH_CONIF}
              >
                {this.props.cpusHost.map((property: any, index: any) => (
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
            {this.props.cpusHost.map((property: any, index: any) => (
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

class MemoryHostGraph extends Component<any, any> {
  state = {
    startIndexMemoryHost: 0,
    endIndexMemoryHost: 0,
  }

  handleHostMemoryZoomChange = (res: any) => {
    this.setState({ startIndexMemoryHost: res.startIndex })
    this.setState({ endIndexMemoryHost: res.endIndex })
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
            data={this.props.hostMemoryData}
            syncId='host'
            margin={GRAPH_CONIF}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value =>
                humanFormat(value, { scale: 'binary', unit: 'B' })
              }
              domain={[0, this.props.memoryMaxHost]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleHostMemoryZoomChange}
              startIndex={this.state.startIndexMemoryHost}
              endIndex={this.state.endIndexMemoryHost}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.hostMemoryData}
                margin={GRAPH_CONIF}
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
  state = {
    startIndexNetworkHost: 0,
    endIndexNetworkHost: 0,
  }

  handleHostNetworkZoomChange = (res: any) => {
    this.setState({ startIndexNetworkHost: res.startIndex })
    this.setState({ endIndexNetworkHost: res.endIndex })
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
            data={this.props.hostNetworkData}
            syncId='host'
            margin={GRAPH_CONIF}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={value =>
                humanFormat(value, { scale: 'binary', unit: 'B' })
              }
              domain={[0, Math.max(1024e3, this.props.networksReceptionHost)]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleHostNetworkZoomChange}
              startIndex={this.state.startIndexNetworkHost}
              endIndex={this.state.endIndexNetworkHost}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.hostNetworkData}
                margin={GRAPH_CONIF}
              >
                {[
                  ...this.props.networksRxHost,
                  ...this.props.networksTransmissionHost,
                ].map((property: any, index: any) => (
                  <Area
                    connectNulls
                    isAnimationActive={false}
                    type='monotone'
                    dataKey={`pifs_${property}_(${
                      index < this.props.networksRxHost.length ? 'rx' : 'tx'
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
              ...this.props.networksRxHost,
              ...this.props.networksTransmissionHost,
            ].map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`pifs_${property}_(${
                  index < this.props.networksRxHost.length ? 'rx' : 'tx'
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
const GRAPH_CONIF = { top: 5, right: 20, left: 90, bottom: 5 }

class LoadHostGraph extends Component<any, any> {
  state = {
    startIndexLoadHost: 0,
    endIndexLoadHost: 0,
  }

  handleHostLoadZoomChange = (res: any) => {
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
            data={this.props.hostLoadData}
            syncId='host'
            margin={GRAPH_CONIF}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis
              tick={{ fontSize: '11px' }}
              domain={[0, Math.max(1, this.props.maxLoad)]}
            />
            <Tooltip />
            <Brush
              onChange={this.handleHostLoadZoomChange}
              startIndex={this.state.startIndexLoadHost}
              endIndex={this.state.endIndexLoadHost}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.hostLoadData}
                margin={GRAPH_CONIF}
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
