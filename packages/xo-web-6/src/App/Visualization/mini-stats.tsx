import React, { Component } from 'react'
import { YAxis, AreaChart, Legend } from 'recharts'

import { Area, Brush, CartesianGrid } from 'recharts'
import Xo from 'xo-lib'

const NB_VALUES = 118

const xo = new Xo({ url: '/' })
xo.open().then(() => xo.signIn({ email: 'admin@admin.net', password: 'admin' }))
const signedIn = new Promise(resolve => xo.once('authenticated', resolve))
const xoCall = (method, params) => signedIn.then(() => xo.call(method, params))

export default class Visualization extends Component<any, any> {
  state: any = {
    /////// VM1
    //Cpu
    dataCpuVm1: [],
    propCpusVm1: [],

    //Disk
    dataDiskVm1: [],
    propDiskRVm1: [],
    propDiskWVm1: [],

    maxDiskWvM1: 0,
    maxDiskRvM1: 0,
    //Network
    dataNetworkVm1: [],
    propNetworkTxVm1: [],
    propNetworkRxVm1: [],

    maxNetworkTxVm1: 0,
    maxNetworkRxVm1: 0,

    //Valeur max

    maxDiskVM1: 0,
    maxVif: 0,

    /////////VM2
    //cpu
    dataCpuVm2: [],
    propCpusVm2: [],

    //Disk
    dataDiskVm2: [],
    propDiskRVm2: [],
    propDiskWVm2: [],

    maxDiskWvM2: 0,
    maxDiskRvM2: 0,
    maxDiskVM2: 0,

    //Network
    dataNetworkVm2: [],
    propNetworkTxVm2: [],
    propNetworkRxVm2: [],

    maxNetworkTxVm2: 0,
    maxNetworkRxVm2: 0,

    click: true,

    granularity: 'seconds',
    format: 'LTS',
  }

  componentDidMount() {
    setInterval(this.fetchStatsVm1.bind(this), 5e3)
    setInterval(this.fetchStatsVm2.bind(this), 5e3)
  }

  setTime = (event: any) => {
    this.setState({ granularity: event.target.value })
  }

  //days, hours, minutes, seconds
  fetchStatsVm1 = () => {
    xoCall('vm.stats', {
      id: '28851ef6-951c-08bc-a5be-8898e2a31b7a',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        stats: { cpus },
        interval,
        stats: { xvds },
        stats: { vifs },
      }) => {
        //A revoir
        let start = endTimestamp - NB_VALUES * interval * 1000
        //Disk w/R
        this.setState({ propDiskWVm1: Object.keys(xvds.w) })
        this.setState({ propDiskRVm1: Object.keys(xvds.r) })
        //cpu
        this.setState({ propCpusVm1: Object.keys(cpus) })

        //network Tx/Rx
        this.setState({ propNetworkTxVm1: Object.keys(vifs.tx) })
        this.setState({ propNetworkRxVm1: Object.keys(vifs.rx) })

        const dataDiskVm1: any[] = []
        const dataCpuVm1: any[] = []
        const dataNetworkVm1: any[] = []
        const cumulCpuVm1: any[] = []

        for (var i = 0; i < NB_VALUES; i++) {
          cumulCpuVm1[i] = 0
          for (var j = 0; j < this.state.propCpusVm1.length; j++) {
            cumulCpuVm1[i] += cpus[j][i]
          }
        }

        for (var i = 0; i < NB_VALUES; i++) {
          const valuesDisk: any = {}
          const valuesCpu: any = {}
          const valuesNetwork: any = {}

          valuesDisk.time = start += 5
          valuesCpu.cpu = valuesDisk.time
          valuesCpu.cpu = cumulCpuVm1

          this.state.propDiskWVm1.forEach((property: string | number) => {
            valuesDisk[`xvds_w_${property}`] = xvds.w[property][i]
          })

          this.state.propDiskRVm1.forEach((property: string | number) => {
            valuesDisk[`xvds_r_${property}`] = xvds.r[property][i]
          })

          this.state.propNetworkTxVm1.forEach((property: string | number) => {
            valuesNetwork[`vifs_tx_${property}`] = vifs.tx[property][i]
          })

          this.state.propNetworkRxVm1.forEach((property: string | number) => {
            valuesNetwork[`vifs_rx_${property}`] = vifs.rx[property][i]
          })

          dataNetworkVm1.push(valuesNetwork)

          dataCpuVm1.push(valuesCpu)
          dataDiskVm1.push(valuesDisk)
        }

        //Calcule du max
        for (var i = 0; i < this.state.propDiskWVm1.length; i++) {
          this.state.propDiskWVm1.forEach((property: string | number) => {
            this.state.maxDiskWvM1 = Math.max(...xvds.w[property])
          })
        }

        for (var i = 0; i < this.state.propDiskRVm1.length; i++) {
          this.state.propDiskRVm1.forEach((property: string | number) => {
            this.state.maxDiskRvM1 = Math.max(...xvds.r[property])
          })
        }

        for (var i = 0; i < this.state.propNetworkTxVm1.length; i++) {
          this.state.propNetworkTxVm1.forEach((property: string | number) => {
            this.state.maxNetworkTxVm1 = Math.max(...vifs.tx[property])
          })
        }

        for (var i = 0; i < this.state.propNetworkRxVm1.length; i++) {
          this.state.propNetworkRxVm1.forEach((property: string | number) => {
            this.state.maxNetworkRxVm1 = Math.max(...vifs.rx[property])
          })
        }

        this.state.maxDiskVM1 = Math.max(
          this.state.maxDiskWvM1,
          this.state.maxDiskRvM1
        )
        this.state.maxVVM1 = Math.max(
          this.state.maxNetworkTxVm1,
          this.state.maxNetworkRxVm1
        )

        this.setState({ dataDiskVm1, dataCpuVm1, dataNetworkVm1 })
      }
    )
  }

  fetchStatsVm2 = () => {
    xoCall('vm.stats', {
      id: '8c05611a-0f25-948e-dc1a-49329576866d',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        stats: { vifs },
        interval,
        stats: { cpus },
        stats: { xvds },
      }) => {
        //let interval =this.getHours()

        this.setState({ propDiskWVm2: Object.keys(xvds.w) })
        this.setState({ propDiskRVm2: Object.keys(xvds.r) })

        this.setState({ propCpusVm2: Object.keys(cpus) })

        this.setState({ propNetworkTxVm2: Object.keys(vifs.tx) })
        this.setState({ propNetworkRxVm2: Object.keys(vifs.rx) })

        const dataDiskVm2: any[] = []

        const dataCpuVm2: any[] = []

        const dataNetworkVm2: any[] = []
        const cumulCpuVm2: any[] = []
        for (var i = 0; i < NB_VALUES; i++) {
          cumulCpuVm2[i] = 0
          for (var j = 0; j < this.state.propCpusVm2.length; j++) {
            cumulCpuVm2[i] += cpus[j][i]
          }
        }
        for (var i = 0; i < NB_VALUES; i++) {
          let start = endTimestamp - NB_VALUES * interval * 1000
          const valuesDisk: any = {}
          const valuesCpu: any = {}
          const valuesNetwork: any = {}

          valuesDisk.time = start += interval
          valuesCpu.time = valuesDisk.time
          valuesNetwork.time = valuesDisk.time

          valuesCpu.cpu = cumulCpuVm2

          this.state.propDiskWVm2.forEach((property: string | number) => {
            valuesDisk[`xvds_w_${property}`] = xvds.w[property][i]
          })

          this.state.propDiskRVm2.forEach((property: string | number) => {
            valuesDisk[`xvds_r_${property}`] = xvds.r[property][i]
          })

          this.state.propNetworkTxVm2.forEach((property: string | number) => {
            valuesNetwork[`vifs_tx_${property}`] = vifs.tx[property][i]
          })

          this.state.propNetworkRxVm2.forEach((property: string | number) => {
            valuesNetwork[`vifs_rx_${property}`] = vifs.rx[property][i]
          })

          dataNetworkVm2.push(valuesNetwork)
          dataCpuVm2.push(valuesCpu)
          dataDiskVm2.push(valuesDisk)
        }

        for (var i = 0; i < this.state.propDiskWVm2.length; i++) {
          this.state.propDiskWVm2.forEach((property: string | number) => {
            this.state.maxDiskWvM2 = Math.max(...xvds.w[property])
          })
        }

        for (var i = 0; i < this.state.propDiskRVm2.length; i++) {
          this.state.propDiskRVm2.forEach((property: string | number) => {
            this.state.maxDiskRvM2 = Math.max(...xvds.r[property])
          })
        }

        for (var i = 0; i < this.state.propNetworkTxVm2.length; i++) {
          this.state.propNetworkTxVm2.forEach((property: string | number) => {
            this.state.maxNetworkTxVm2 = Math.max(...vifs.tx[property])
          })
        }

        for (var i = 0; i < this.state.propNetworkRxVm2.length; i++) {
          this.state.propNetworkRxVm2.forEach((property: string | number) => {
            this.state.maxNetworkRxVm2 = Math.max(...vifs.rx[property])
          })
        }

        this.state.maxDiskVM2 = Math.max(
          this.state.maxDiskWvM2,
          this.state.maxDiskRvM2
        )
        this.state.maxVVM2 = Math.max(
          this.state.maxNetworkTxVm2,
          this.state.maxNetworkRxVm2
        )

        this.setState({ dataDiskVm2, dataCpuVm2, dataNetworkVm2 })
      }
    )
  }

  setMaxValueDisk = () => {
    if (this.state.click) {
      if (this.state.maxDiskVM1 < 1000000 && this.state.maxDiskVM2 < 1000000) {
        this.state.maxVif = 1000000
        this.state.click = false
      } else {
        this.state.maxVif = Math.max(
          this.state.maxDiskVM1,
          this.state.maxDiskVM2
        )

        this.state.click = false
      }
    } else {
      this.state.maxVif = 0

      this.state.click = true
    }
  }

  setMaxValueNetwork = () => {
    if (this.state.click) {
      if (this.state.maxVVM1 < 1000000 && this.state.maxVVM2 < 1000000) {
        this.state.maxV = 1000000
        this.state.click = false
      } else {
        this.state.maxV = Math.max(this.state.maxVVM1, this.state.maxVVM2)

        this.state.click = false
      }
    } else {
      this.state.maxV = 0
      this.state.click = true
    }
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
        <div>
          <button onClick={this.setMaxValueDisk}>Synchronize scale disk</button>
          <button onClick={this.setMaxValueNetwork}>
            Synchronize scale network
          </button>
        </div>

        <VuStatsDiskVM1
          dataDiskVm1={this.state.dataDiskVm1}
          propDiskRVm1={this.state.propDiskRVm1}
          propDiskWVm1={this.state.propDiskWVm1}
          maxVif={this.state.maxVif}
        />
        <VuStatsDiskVM2
          dataDiskVm2={this.state.dataDiskVm2}
          propDiskWVm2={this.state.propDiskWVm2}
          propDiskRVm2={this.state.propDiskRVm2}
          maxVif={this.state.maxVif}
        />
        <VuStatsCpuVM1
          dataCpuVm1={this.state.dataCpuVm1}
          propCpusVm1={this.state.propCpusVm1}
        />
        <VuStatsCpuVM2
          dataCpuVm2={this.state.dataCpuVm2}
          propCpusVm2={this.state.propCpusVm2}
        />
        <VuStatsNetworkVM1
          dataNetworkVm1={this.state.dataNetworkVm1}
          propNetworkTxVm1={this.state.propNetworkTxVm1}
          propNetworkRxVm1={this.state.propNetworkRxVm1}
          maxV={this.state.maxV}
        />

        <VuStatsNetworkVM2
          dataNetworkVm2={this.state.dataNetworkVm2}
          propNetworkTxVm2={this.state.propNetworkTxVm2}
          propNetworkRxVm2={this.state.propNetworkRxVm2}
          maxV={this.state.maxV}
        />
      </div>
    )
  }
}

class VuStatsDiskVM1 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxVif: 0,
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
    const colors = [
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

    return (
      <div>
        <div>Disk throughput Vm1</div>
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataDiskVm1}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, this.props.maxVif]} />
            <Legend iconType='rect' iconSize={10} />
            {this.props.propDiskWVm1
              .map((currProperty: any) => `xvds_w_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[index]}
                  fill={allColors[index]}
                />
              ))}
            {this.props.propDiskRVm1
              .map((currProperty: any) => `xvds_r_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={colors[index]}
                  fill={colors[index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuStatsDiskVM2 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxVif: 0,
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
    const colors = [
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

    return (
      <div>
        <div>Disk throughput Vm2</div>
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataDiskVm2}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, this.props.maxVif]} />
            <Legend iconType='rect' iconSize={10} />
            {this.props.propDiskWVm2
              .map((currProperty: any) => `xvds_w_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[index]}
                  fill={allColors[index]}
                />
              ))}
            {this.props.propDiskRVm2
              .map((currProperty: any) => `xvds_r_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={colors[index]}
                  fill={colors[index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuStatsCpuVM1 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
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
          <h2>CPU Usage VM1 </h2>
        </div>

        <div>
          <div> {this.props.propCpusVm1.length} X CPU (%)</div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataCpuVm1}
            syncId='anyId'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, this.props.propCpusVm1.length * 100]} />
            <Area
              connectNulls
              isAnimationActive={false}
              type='monotone'
              dataKey='cpu'
              stroke={'blue'}
              fill={'blue'}
            />
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuStatsCpuVM2 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
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
          <h2>CPU Usage VM2 </h2>
        </div>

        <div>
          <div> {this.props.propCpusVm2.length} X CPU (%)</div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataCpuVm2}
            syncId='anyId'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, this.props.propCpusVm2.length * 100]} />
            <Area
              connectNulls
              isAnimationActive={false}
              type='monotone'
              dataKey='cpu'
              stroke={'blue'}
              fill={'blue'}
            />
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuStatsNetworkVM1 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxVif: 0,
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
    const colors = [
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

    return (
      <div>
        <div>Network throughput Vm1</div>
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataNetworkVm1}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, this.props.maxV]} />
            <Legend iconType='rect' iconSize={10} />
            {this.props.propNetworkTxVm1
              .map((currProperty: any) => `vifs_tx_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[index]}
                  fill={allColors[index]}
                />
              ))}
            {this.props.propNetworkRxVm1
              .map((currProperty: any) => `vifs_rx_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={colors[index]}
                  fill={colors[index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuStatsNetworkVM2 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxVif: 0,
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
    const colors = [
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

    return (
      <div>
        <div>Network throughput Vm2</div>
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataNetworkVm2}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, this.props.maxVif]} />
            <Legend iconType='rect' iconSize={10} />
            {this.props.propNetworkTxVm2
              .map((currProperty: any) => `vifs_tx_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[index]}
                  fill={allColors[index]}
                />
              ))}
            {this.props.propNetworkRxVm2
              .map((currProperty: any) => `vifs_rx_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={colors[index]}
                  fill={colors[index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}
