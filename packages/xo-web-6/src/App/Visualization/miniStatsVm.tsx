import React, { Component } from 'react'
import { YAxis, AreaChart, Legend } from 'recharts'
import Xo from 'xo-lib'

import { Area } from 'recharts'

const xo = new Xo({ url: '/' })

xo.open().then(() => xo.signIn({ email: 'admin@admin.net', password: 'admin' }))
const signedIn = new Promise(resolve => xo.once('authenticated', resolve))
const xoCall = (method: any, params: any) =>
  signedIn.then(() => xo.call(method, params))

const getObjects = (id: any) =>
  xoCall('xo.getAllObjects', { filter: { id } }).then(objects => objects[id])

const NB_VALUES = 118

const tabId = [
  'fc01a8d7-99c1-c722-2c0f-85281d3c1183',
  'f335bc80-d0de-e270-9218-3d3f2c6689b2',
  'f4953eb3-f17f-2822-bffe-2101f84b532d',
]

export default class Visualization extends Component<any, any> {
  state: any = {
    vmIds: 0,
  }
  render() {
    return (
      <div>
      <div>
        <VmsMemoryStats vmIds={tabId} />
      </div>
       <div>
       <VmsCpuStats vmIds={tabId} />
     </div>
     <div>
       <VmsDiskStats vmIds={tabId} />
     </div>
     <div>
       <VmsNetworkStats vmIds={tabId} />
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

class VmsDiskStats extends Component<any, any> {
  state: any = {
    vmId: 0,
  }
  render() {
    return this.props.vmIds.map((vmId: any) => (
      <VmDiskStats vmId={vmId} key={vmId} />
    ))
  }
}
class VmsNetworkStats extends Component<any, any> {
  state: any = {
    vmId: 0,
  }
  render() {
    return this.props.vmIds.map((vmId: any) => (
      <VmNetworkStats vmId={vmId} key={vmId} />
    ))
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
    getObjects(this.props.vmId).then((vm: any) => {
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
              domain={[0, this.state.maxMemory]}
            />
            <Area
              type='monotone'
              dataKey='memory'
              stroke='#493BD8'
              fill='#493BD8'
            />
          </AreaChart>
        </div>
        <br />
      </div>
    )
  }
}

class VmCpuStats extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxMemory: 0,
    cpusVm: [],
    cpuDataVm: [],
    dataCpu: [],
  }
  componentDidMount() {
    setInterval(this.fetchVmStats.bind(this), 5e3)
  }

  fetchVmStats = () => {
    
    xoCall('vm.stats', {
      id: this.props.vmId,
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        stats: { cpus },
        interval,
      
      }) => {
       
        this.setState({ cpusVm: Object.keys(cpus) })

        let cpuDataVm: any[] = []

        for (var i = 0; i < NB_VALUES; i++) {
          let valuesCpus: any = {}
       
          valuesCpus.time = (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          
          this.state.cpusVm.forEach((property: string | number) => {
            valuesCpus[`cpu${property}`] = cpus[property][i]
          })         
          cpuDataVm.push(valuesCpus)       
        }
       
        this.setState({ cpuDataVm})
      }
    )
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
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => tick + ' %'}
            /> 
            <Legend iconType='rect' iconSize={10} />
            {this.state.cpusVm
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

//
class VmDiskStats extends Component<any, any> {
  state: any = {
    diskDataVm: [],
    disksWriting: [],
    disksReading: [],
    maxDisk: 0,
  }
  componentDidMount() {
    setInterval(this.fetchVmDiskStats.bind(this), 5e3)
  }
  fetchVmDiskStats = () => {
   
    xoCall('vm.stats', {
      id: this.props.vmId,
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        interval,
        stats: { xvds },
      }) => {
      
        this.setState({ disksWriting: Object.keys(xvds.w) })
        this.setState({ disksReading: Object.keys(xvds.r) })

        let diskDataVm: any[] = []
             
        for (var i = 0; i < NB_VALUES; i++) {
        
          let ValuesDisk: any = {}
          
       
          this.state.disksWriting.forEach((property: string | number) => {
            ValuesDisk[`xvds_${property}_(w)`] = xvds.w[property][i]
          })

          this.state.disksReading.forEach((property: string | number) => {
            ValuesDisk[`xvds_${property}_(r)`] = xvds.r[property][i]
          })
      
          ValuesDisk.time = (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
          diskDataVm.push(ValuesDisk)
        
        }
  
        this.state.disksWriting.forEach((property: string | number) => {
          this.state.maxDiskW=Math.max(...xvds.w[property]);
          this.setState({ maxDiskW: Math.max(...xvds.w[property]) })
        })

        this.state.disksReading.forEach((property: string | number) => {
          this.state.maxDiskR=Math.max(...xvds.r[property]);
          this.setState({ maxDiskR: Math.max(...xvds.r[property]) })
        })
      
          this.setState({ maxDisk: Math.max(this.state.maxDiskW, this.state.maxDiskR) })
        
      /*   this.state.maxDisk = Math.max(this.state.maxDiskW, this.state.maxDiskR) */
        this.setState({ diskDataVm })
      }
    )
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
            data={this.state.diskDataVm}
            syncId='vm'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          > 
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => this.formatBytes(tick, 2)}
              domain={[0, Math.max(1000000000, this.state.maxDisk)]}
            />
            <Legend iconType='rect' iconSize={10} />

            {[ ...this.state.disksWriting, ...this.state.disksReading]
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={`xvds_${property}_(${index < this.state.disksWriting.length ? 'w' : 'r'})`}
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

//

class VmNetworkStats extends Component<any, any> {
  state: any = {
    networkDataVm: [],
    networksTransmissionVm: [],
    networksReceptionVm: [],
    maxNetworkVm: 0,
  }

  componentDidMount() {
    setInterval(this.fetchVmNetworkStats.bind(this), 5e3)
  }

  fetchVmNetworkStats = () => {
  
    xoCall('vm.stats', {
      id: this.props.vmId,
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        interval,
        stats: { vifs },
      }) => {
      
        this.setState({ networksTransmissionVm: Object.keys(vifs.tx) })
        this.setState({ networksReceptionVm: Object.keys(vifs.rx) })

        let networkDataVm: any[] = [] 

        for (var i = 0; i < NB_VALUES; i++) {
        
          let valuesNetwork: any = {}
          this.state.networksTransmissionVm.forEach((property: string | number) => {
            valuesNetwork[`vifs_${property}_(tx)`] = vifs.tx[property][i]
          })

          this.state.networksReceptionVm.forEach((property: string | number) => {
            valuesNetwork[`vifs_${property}_(rx)`] = vifs.rx[property][i]
          })

          valuesNetwork.time = (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000  
          networkDataVm.push(valuesNetwork)
        }
       
        this.state.networksTransmissionVm.forEach((property: string | number) => {
          this.state.maxNetworkTx= Math.max(...vifs.tx[property])
          this.setState({ maxNetworkTx: Math.max(...vifs.tx[property]) })
        })

        this.state.networksReceptionVm.forEach((property: string | number) => {
          this.state.maxNetworkRx= Math.max(...vifs.rx[property])
          this.setState({ maxNetworkRx: Math.max(...vifs.rx[property]) })
        })

        this.setState({ maxNetworkVm :Math.max(
          this.state.maxNetworkTx,
          this.state.maxNetworkRx
        ) })

       /*  this.state.maxNetworkVm = Math.max(
          this.state.maxNetworkTx,
          this.state.maxNetworkRx
        )  */

        this.setState({ networkDataVm})
      }
    )
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
            data={this.state.networkDataVm}
            syncId='vm'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
           
            <YAxis
              tick={{ fontSize: '11px' }}
              tickFormatter={tick => this.formatBytes(tick, 2)}
              domain={[0, Math.max(1000000, this.state.maxNetworkVm)]}
            /> 
            <Legend iconType='rect' iconSize={10} />
            {[ ...this.state.networksTransmissionVm, ...this.state.networksReceptionVm]
                  .map((property: any, index: any) => (
                    <Area
                      connectNulls
                      isAnimationActive={false}
                      type='monotone'
                      dataKey={`vifs_${property}_(${index < this.state.networksTransmissionVm.length ? 'tx' : 'rx'})`}
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