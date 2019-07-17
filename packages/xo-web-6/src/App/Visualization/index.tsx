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

const NB_VALUES = 118

const xo = new Xo({ url: '/' })
xo.open().then(() => xo.signIn({ email: 'admin@admin.net', password: 'admin' }))
const signedIn = new Promise(resolve => xo.once('authenticated', resolve))
const xoCall = (method, params) => signedIn.then(() => xo.call(method, params))

export default class Visualization extends Component<any, any> {
  state: any = {
    data: [],
    propCpus: [],
    granularity: 'seconds',
    format: 'LTS',
    startIndexCpuVm: 0,
    endIndexCpuVm: 0,
    startIndexMemoryVm: 0,
    endIndexMemoryVm: 0,
    dataMemory: [],
  }

  componentDidMount() {
    setInterval(this.fetchVmStats.bind(this), 5e3)
  }

  fetchVmStats = () => {
    xoCall('vm.stats', {
      id: '28851ef6-951c-08bc-a5be-8898e2a31b7a',
      granularity: this.state.granularity,
    }).then(
      ({ endTimestamp, stats: { cpus }, interval, stats: { memory } }) => {
        let start = endTimestamp - NB_VALUES * interval * 100
        this.setState({ propCpus: Object.keys(cpus) })
        const data: any[] = []
        const dataMemory: any[] = []

        for (let i = 0; i < NB_VALUES; i++) {
          const tmpValue: any = {}
          const tmpValueMemory: any = {}
          tmpValue.time = start += interval
          this.state.propCpus.forEach((property: string | number) => {
            tmpValue[`cpu${property}`] = cpus[property][i]
          })

          tmpValueMemory.time = tmpValue.time
          tmpValueMemory.memory = memory[i]
          data.push(tmpValue)
          dataMemory.push(tmpValueMemory)
        }
        this.setState({ data, dataMemory })
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
              <option value='seconds'>Last 5 secondes</option>
              <option value='minutes'>Last 10 minutes</option>
              <option value='hours'>Last 2 hours</option>
              <option value='days'>Last year</option>
            </select>
          </form>
        </div>
        <VuCpuStats data={this.state.data} propCpus={this.state.propCpus} />
        <VuMemoryStats dataMemory={this.state.dataMemory} />
      </div>
    )
  }
}

class VuCpuStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
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
        <div>CPU usage (%)</div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.data}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis axisLine={false} />
            <Tooltip />
            <Brush
              onChange={this.handleChangeCpuVm}
              startIndex={this.state.startIndexCpuVm}
              endIndex={this.state.endIndexCpuVm}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.data}
                margin={{
                  top: 5,
                  right: 20,
                  left: 90,
                  bottom: 5,
                }}
              >
                {this.props.propCpus
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
            {this.props.propCpus
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

class VuMemoryStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    startIndexMemoryVm: 0,
    endIndexMemoryVm: 0,
  }

  handleChangeMemoryVm = (res: any) => {
    this.setState({ startIndexMemoryVm: res.startIndex })
    this.setState({ endIndexMemoryVm: res.endIndex })
  }

  render() {
    return (
      <div>
        <div>Memory (MiB)</div>
        <br />
        <div>
          <AreaChart
            width={830}
            height={300}
            data={this.props.dataMemory}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' />
            <YAxis axisLine={false} />
            <Tooltip />
            <Brush
              onChange={this.handleChangeMemoryVm}
              startIndex={this.state.startIndexMemoryVm}
              endIndex={this.state.endIndexMemoryVm}
            >
              <AreaChart
                width={830}
                height={300}
                data={this.props.dataMemory}
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
