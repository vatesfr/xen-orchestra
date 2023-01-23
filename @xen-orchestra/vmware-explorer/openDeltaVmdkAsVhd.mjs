import VhdEsxiCowd from "./VhdEsxiCowd.mjs";
import VhdEsxiSeSparse from "./VhdEsxiSeSparse.mjs";


export default async function openDeltaVmdkasVhd(esxi, datastore, path, parentVhd){
    console.log('openDeltaVmdkasVhd')
    let vhd 
    if(path.endsWith('-sesparse.vmdk')){
        vhd = new VhdEsxiSeSparse(esxi, datastore, path, parentVhd)
    } else{
        if(path.endsWith('-delta.vmdk')){
         vhd = new VhdEsxiCowd(esxi, datastore, path, parentVhd)
        } else {
            throw new Error( `Vmdk ${path} does not seems to be a delta vmdk`)
        }
    }
    await vhd.readHeaderAndFooter()
    console.log('will  readBlockAllocationTable')
    await vhd.readBlockAllocationTable()
    console.log(' readBlockAllocationTable')
    return vhd
}