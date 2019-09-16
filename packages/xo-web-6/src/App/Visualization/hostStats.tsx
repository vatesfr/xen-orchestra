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
    hostCpus: [],

    // Memory
    hostMemoryData: [],
    hostMemoryMax: 0,

    //  Network
    hostNetworkData: [],
    hostNetworksReception: [],
    hostNetworksTransmission: [],
    hostNetworksMax: [],

    //  Load
    hostLoadData: [],
    hostLoadMax: 0,
  }

  componentDidMount() {
    setInterval(this.fetchHostStats.bind(this), 5e3)
  }

  fetchHostStats = () => {
    getObject('b54bf91f-51d7-4af5-b1b3-f14dcf1146ee').then((host: any) => {
      this.setState({ hostMemoryMax: host.memory.size })
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
          hostCpus: Object.keys(cpus),
          hostNetworksReception: Object.keys(pifs.rx),
          hostNetworksTransmission: Object.keys(pifs.tx),
        })
        let hostCpuData: any[] = []
        let hostMemoryData: any[] = []
        let hostNetworkData: any[] = []
        let hostLoadData: any[] = []
        let hostMemoryNewData: any = []

        hostMemoryNewData = memoryFree.map(
          (value: any, index: any) => memory[index] - value
        )

        for (var i = 0; i < NB_VALUES; i++) {
          let hostCpusValues: any = {}
          let hostMemoryValues: any = {}
          let hostNetworkValues: any = {}
          let hostLoadValues: any = {}

          hostCpusValues.time = moment(
            (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          ).format(format)

          this.state.hostCpus.forEach((property: string | number) => {
            hostCpusValues[`cpu${property}`] = cpus[property][i]
          })

          this.state.hostNetworksReception.forEach(
            (property: string | number) => {
              hostNetworkValues[`pifs_${property}_(rx)`] = pifs.rx[property][i]
            }
          )

          this.state.hostNetworksTransmission.forEach(
            (property: string | number) => {
              hostNetworkValues[`pifs_${property}_(tx)`] = pifs.tx[property][i]
            }
          )

          hostLoadValues.load = load[i]
          hostMemoryValues.memory = hostMemoryNewData[i]
          hostMemoryValues.time = hostCpusValues.time
          hostNetworkValues.time = hostCpusValues.time
          hostLoadValues.time = hostCpusValues.time
          hostCpuData.push(hostCpusValues)
          hostNetworkData.push(hostNetworkValues)
          hostLoadData.push(hostLoadValues)
          hostMemoryData.push(hostMemoryValues)
        }
        this.setState({ hostLoadMax: Math.max(...load) })
        this.state.hostNetworksTransmission.forEach(
          (property: string | number) => {
            this.setState({ maxNetworkTx: Math.max(...pifs.tx[property]) })
          }
        )

        this.state.hostNetworksReception.forEach(
          (property: string | number) => {
            this.setState({ maxNetworkRx: Math.max(...pifs.rx[property]) })
          }
        )

        this.setState({
          hostNetworksMax: Math.max(
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
        <HostCpuGraph
          hostCpuData={this.state.hostCpuData}
          hostCpus={this.state.hostCpus}
        />
        <HostMemoryGraph
          hostMemoryData={this.state.hostMemoryData}
          hostMemoryMax={this.state.hostMemoryMax}
        />
        <HostNetworkGraph
          hostNetworkData={this.state.hostNetworkData}
          hostNetworksReception={this.state.hostNetworksReception}
          hostNetworksTransmission={this.state.hostNetworksTransmission}
          hostNetworksMax={this.state.hostNetworksMax}
        />
        <HostLoadGraph
          hostLoadData={this.state.hostLoadData}
          hostLoadMax={this.state.hostLoadMax}
        />
      </div>
    )
  }
}

class HostCpuGraph extends Component<any, any> {
  state = {
    hostCpuStartIndex: 0,
    hostCpuEndIndex: 0,
  }

  handleHostCpuZoomChange = (res: any) => {
    this.setState({ hostCpuStartIndex: res.startIndex })
    this.setState({ hostCpuEndIndex: res.endIndex })
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
              startIndex={this.state.hostCpuStartIndex}
              endIndex={this.state.hostCpuEndIndex}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.hostCpuData}
                margin={GRAPH_CONIF}
              >
                {this.props.hostCpus.map((property: any, index: any) => (
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
            {this.props.hostCpus.map((property: any, index: any) => (
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

class HostMemoryGraph extends Component<any, any> {
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
              domain={[0, this.props.hostMemoryMax]}
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

class HostNetworkGraph extends Component<any, any> {
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
              domain={[0, Math.max(1024e3, this.props.hostNetworksMax)]}
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
                  ...this.props.hostNetworksReception,
                  ...this.props.hostNetworksTransmission,
                ].map((property: any, index: any) => (
                  <Area
                    connectNulls
                    isAnimationActive={false}
                    type='monotone'
                    dataKey={`pifs_${property}_(${
                      index < this.props.hostNetworksReception.length
                        ? 'rx'
                        : 'tx'
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
              ...this.props.hostNetworksReception,
              ...this.props.hostNetworksTransmission,
            ].map((property: any, index: any) => (
              <Area
                connectNulls
                isAnimationActive={false}
                type='monotone'
                dataKey={`pifs_${property}_(${
                  index < this.props.hostNetworksReception.length ? 'rx' : 'tx'
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

class HostLoadGraph extends Component<any, any> {
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
              domain={[0, Math.max(1, this.props.hostLoadMax)]}
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
