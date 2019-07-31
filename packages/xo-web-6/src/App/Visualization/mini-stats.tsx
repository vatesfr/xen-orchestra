import React, { Component } from 'react'
import { YAxis, AreaChart, Legend, XAxis } from 'recharts'

import { Area, Brush, CartesianGrid } from 'recharts'
import Xo from 'xo-lib'

const NB_VALUES = 118

const xo = new Xo({ url: '/' })
xo.open().then(() => xo.signIn({ email: 'admin@admin.net', password: 'admin' }))
const signedIn = new Promise(resolve => xo.once('authenticated', resolve))
const xoCall = (method, params) => signedIn.then(() => xo.call(method, params))
const getObjects = (id: any) =>
  xoCall('xo.getAllObjects', { filter: { id } }).then(objects => objects[id])

export default class Visualization extends Component<any, any> {

  state: any = {
    
    /////// VM1
    //Memory
    dataMemoryVm1: [],
    valueMaxVm1Memory: 0,

    /////////VM2
    //Memory
    dataMemoryVm2: [],
    valueMaxVm2Memory: 0,
   
    granularity: 'seconds',
    format: 'LTS',
  }

  componentDidMount() {
    setInterval(this.fetchStatsVm1.bind(this), 5e3)
    setInterval(this.fetchStatsVm2.bind(this), 5e3)
  }

  fetchStatsVm1 = () => {
    getObjects('28851ef6-951c-08bc-a5be-8898e2a31b7a').then((vm: any) => {
      this.setState({ valueMaxVm1Memory: vm.memory.dynamic[1] })
    })

    xoCall('vm.stats', {
      id: '28851ef6-951c-08bc-a5be-8898e2a31b7a',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        interval,
        stats: { memory },
        stats: {memoryFree}
      }) => {
             
        let newDataMemory: any[] = []
        let dataMemoryVm1:any[]=[]

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
          valuesMemory.time = (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
         valuesMemory.memory = newDataMemory[i]
          dataMemoryVm1.push(valuesMemory)
        }
        this.setState({ 
          dataMemoryVm1,
        })
      }
    )
    
 }
   fetchStatsVm2 = () => {
    getObjects('854918b4-94e7-dbcb-8ae9-c8701785aa71').then((vm: any) => {
      this.setState({ valueMaxVm2Memory: vm.memory.dynamic[1] })
    })
    xoCall('vm.stats', {
      id: '854918b4-94e7-dbcb-8ae9-c8701785aa71',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        interval,
        stats: { memory },
        stats:{memoryFree},
      }) => {    
        const dataMemoryVm2: any[] = []
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
        const valuesMemory: any = {}
        valuesMemory.time = (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
        valuesMemory.memory= newDataMemory[i]
        dataMemoryVm2.push(valuesMemory)
        }

        this.setState({         
          dataMemoryVm2
        })
      }
    )
  } 
 
  render() {
    return (
      <div> 
        <VuStatsMemoryVM1
          dataMemoryVm1={this.state.dataMemoryVm1}
          valueMaxVm1Memory={this.state.valueMaxVm1Memory}
        />
        <VuStatsMemoryVM2
          dataMemoryVm2={this.state.dataMemoryVm2}
          valueMaxVm2Memory={this.state.valueMaxVm2Memory}
        />
      </div>
    )
  }

}

class VuStatsMemoryVM2 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
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
          <h2>Memory Vm2</h2>
        </div>
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataMemoryVm2}
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
              domain={[0, this.props.valueMaxVm2Memory]}
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

class VuStatsMemoryVM1 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
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
            data={this.props.dataMemoryVm1}
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
              domain={[0, this.props.valueMaxVm1Memory]}
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







