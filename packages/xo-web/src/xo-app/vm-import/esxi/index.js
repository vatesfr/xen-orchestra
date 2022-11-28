import React, { Component } from "react";
import { Container } from "../../../common/grid";


class VmSetting extends Component{
  render(){
    return 'network map , description, label, start after import , stop source after import'
  }
}

class VMPicker extends Component{
  render(){
    return 'vmlist'
  }
}


// connexion form to esxi
class Esxi extends Component{
  _connect(host, login, password, sslVerify){

  }

  render(){
    const {esxi} = this.props
    return 'host, login password'
  }
}

export default class ImportVmFromEsxi extends Component{
  render(){
    const { esxi, vms, vmId } = this.state || {}

    if(vmId){
      return <VmSetting vms={vms} vmId={vmId} esxi={esxi}/>
    }

    if(vms){
      return <VMPicker vms={vms} esxi={esxi}/>
    }


    return <Esxi onConnect={esxi=>this.setState({esxi})} esxi={esxi} onVmList={vms=>this.setState({vms})}/>
  }
}
