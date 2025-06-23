// @ts-check

export async function readVmx(accessor, vmxPath, {isRunning = false, knwownDatastores=new Map()}={}){
    // read the vmx file and get the transferrable VM data 

    // ensure the VM don't use VSAN 
    // ensure the disk are on the local or a known datastore
    // ensure the VM don't use native Snapshot


    // if is running => return the parents disk ( may be empty without snapshot ) 

    return {
        name:'',
        memory:1,
        nCpus:1,
        description:'', 
        firmware: 'uefi', 
        networks: [{
            label: 'label',
          macAddress: '',
          isGenerated: true,
        }]
    }


}