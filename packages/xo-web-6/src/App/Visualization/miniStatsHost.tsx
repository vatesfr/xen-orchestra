
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
      valueMaxNetwork: 0,
    }

    setMaxNetwork = (value: number) => {
      if (this.state.valueMaxNetwork < value) {
        this.setState({
          valueMaxNetwork: value,
        })
       
      }
    }

    render() {
      return this.props.hostIds.map((hostId: any) => (
        <HostNetworkStats hostId={hostId} key={hostId}  setMaxNetwork={this.setMaxNetwork} valueMaxNetwork={this.state.valueMaxNetwork} />
      ))
    }
  }

  class HostsLoadStats extends Component<any, any> {
    state: any = {
      hostId: 0,
      valueMaxLoad:0
    }

    setMaxLoad = (value: number) => {
      if (this.state.valueMaxLoad < value) {
        this.setState({
          valueMaxLoad: value,
        })
      }
    }

    render() {
      return this.props.hostIds.map((hostId: any) => (
        <HostLoadStats hostId={hostId} key={hostId} setMaxLoad={this.setMaxLoad} valueMaxLoad={this.state.valueMaxLoad}/>
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
      getObjects(this.props.hostId).then((host: any) => {
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
                domain={[0, this.state.maxMemoryHost]}
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
      }).then(
        ({
          endTimestamp,
          stats: { cpus },
          interval,
        
        }) => {
         
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
                  <Area
                    connectNulls
                    isAnimationActive={false}
                    type='monotone'
                    dataKey='cpu'
                    stroke='blue'
                    fill='blue'
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
      networkDataVm: [],
      networksTransmissionVm: [],
      networksReceptionVm: [],
      maxNetworkVm: 0,
    }
  
    componentDidMount() {
      setInterval(this.fetchVmNetworkStats.bind(this), 5e3)
    }
  
    fetchVmNetworkStats = () => {
    
      xoCall('host.stats', {
        host: this.props.hostId,
        granularity: this.state.granularity,
      }).then(
        ({
          endTimestamp,
          interval,
          stats: { pifs },
        }) => {
        
          this.setState({ networksTransmissionVm: Object.keys(pifs.tx) })
          this.setState({ networksReceptionVm: Object.keys(pifs.rx) })
  
          let networkDataVm: any[] = [] 
  
          for (var i = 0; i < NB_VALUES; i++) {
          
            let valuesNetwork: any = {}

            this.state.networksTransmissionVm.forEach((property: string | number) => {
              const networkValueT= pifs.tx[property][i]
              if(this.state.maxNetworkTx === undefined || networkValueT > this.state.maxNetworkTx){
              this.setState({ maxNetworkTx: networkValueT })
              }
              valuesNetwork[`pifs_${property}_(tx)`] = pifs.tx[property][i]
            })
  
            this.state.networksReceptionVm.forEach((property: string | number) => {
              const networkValueR= pifs.rx[property][i]
              if(this.state.maxNetworkRx === undefined || networkValueR > this.state.maxNetworkRx){
                this.setState({ maxNetworkRx: networkValueR })
              }

              valuesNetwork[`pifs_${property}_(rx)`] = pifs.rx[property][i]
            })  
            valuesNetwork.time = (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000  
            networkDataVm.push(valuesNetwork)

          }
          this.setState({ maxNetworkVm :Math.max(
            this.state.maxNetworkTx,
            this.state.maxNetworkRx
          ) }) 
  
          this.setState({ networkDataVm})
        }
      )
      this.props.setMaxNetwork(this.state.maxNetworkVm)
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
                domain={[0, Math.max(1000000, this.props.valueMaxNetwork)]}
              /> 
              <Legend iconType='rect' iconSize={10} />
              {[ ...this.state.networksTransmissionVm, ...this.state.networksReceptionVm]
                    .map((property: any, index: any) => (
                      <Area
                        connectNulls
                        isAnimationActive={false}
                        type='monotone'
                        dataKey={`pifs_${property}_(${index < this.state.networksTransmissionVm.length ? 'tx' : 'rx'})`}
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

  class HostLoadStats extends Component<any, any> {
   state:any={
    granularity: 'seconds',
    maxLoad:0,
    loadDataHost:[]
   }

    componentDidMount() {
        setInterval(this.fetchHostStats.bind(this), 5e3)
      }
    
      fetchHostStats = () => {
      
       
        xoCall('host.stats', {
          host: this.props.hostId,
          granularity: this.state.granularity,
        }).then(
          ({
            endTimestamp,
            interval,
            stats: { load },
           
          }) => {
   
            let loadDataHost: any[] = []
       
            for (var i = 0; i < NB_VALUES; i++) {
           
              let valuesLoad: any = {}
              valuesLoad.load = load[i]
              valuesLoad.time = (endTimestamp - (NB_VALUES - i - 1) * interval) * 1000
              loadDataHost.push(valuesLoad)
            }
    
            this.setState({maxLoad:  Math.max(...load)})
    
            this.setState({
              loadDataHost,
            })
          }
        )

        this.props.setMaxLoad(this.state.maxLoad)
      }
  
    render() {
      return (
        <div>
          <div>Load average </div>
          <br />
          <div>
            <AreaChart
              width={400}
              height={100}
              data={this.state.loadDataHost}
              
              margin={{
                top: 5,
                right: 20,
                left: 90,
                bottom: 5,
              }}
            >
              
              <YAxis
                tick={{ fontSize: '11px' }}
                domain={[0, Math.max(1, this.props.valueMaxLoad)]}
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
  