import React, { Component } from 'react'
import { YAxis, AreaChart, Legend, XAxis } from 'recharts'
import Xo from 'xo-lib'
import moment, { max } from 'moment'
import { Area, Brush, CartesianGrid } from 'recharts'

const xo = new Xo({ url: '/' })

xo.open().then(() => xo.signIn({ email: 'admin@admin.net', password: 'admin' }))
const signedIn = new Promise(resolve => xo.once('authenticated', resolve))
const xoCall = (method: any, params: any) =>
  signedIn.then(() => xo.call(method, params))

const getObject = (id: any) =>
  xoCall('xo.getAllObjects', { filter: { id } }).then(objects => objects[id])

const NB_VALUES = 118

const tabId = [
  '28851ef6-951c-08bc-a5be-8898e2a31b7a',
  '8d752a5b-f5a8-b3af-85b4-5a475be3c1a9',
  'f335bc80-d0de-e270-9218-3d3f2c6689b2',
  'f4953eb3-f17f-2822-bffe-2101f84b532d',
  '80eecb72-e593-1106-ca66-f2bca69f46dd',
]

export default class Visualization extends Component<any, any> {
  state: any = {
    valueMaxVmMemory: 0,
    vmId: '',
    dataMemoryVm: [],
  }

  render() {
    return tabId.map((i: any) => (
      <div>
        <VuStatsMemoryVM1
          vmId={i}
          dataMemoryVm={this.state.dataMemoryVm}
          valueMaxVmMemory={this.state.valueMaxVmMemory}
        />
      </div>
    ))
  }
}

class VuStatsMemoryVM1 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    valueMaxVmMemory: 0,
    dataMemoryVm: [],
  }
  componentDidMount() {
    setInterval(this.fetchStatsVm.bind(this), 5e3)
  }

  fetchStatsVm = () => {
    getObject(this.props.vmId).then((vm: any) => {
      this.setState({ valueMaxVmMemory: vm.memory.dynamic[1] })
    })

    xoCall('vm.stats', {
      id: this.props.vmId,

      granularity: this.props.granularity,
    }).then(
      ({
        endTimestamp,
        interval,
        stats: { memory },
        stats: { memoryFree },
      }) => {
        let newDataMemory: any[] = []
        let dataMemoryVm: any[] = []

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
          const valuesMemory: any = {}
          valuesMemory.time =
            (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          valuesMemory.memory = newDataMemory[i]
          dataMemoryVm.push(valuesMemory)
        }
        this.setState({
          dataMemoryVm,
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
        <div>
          <h2>Memory Vm1</h2>
        </div>
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.state.dataMemoryVm}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <Legend iconType='rect' iconSize={10} />
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => this.formatBytes(tick, 0)}
              domain={[0, this.state.valueMaxVmMemory]}
            />
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
