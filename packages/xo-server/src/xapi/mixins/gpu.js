export default {
  createVgpu(vm, gpuGroup, vgpuType) {
    // TODO: properly handle device. Can a VM have 2 vGPUS?
    return this.call(
      'VGPU.create',
      this.getObject(vm).$ref,
      this.getObject(gpuGroup).$ref,
      '0',
      {},
      this.getObject(vgpuType).$ref
    )
  },
  deleteVgpu(vgpu) {
    return this.call('VGPU.destroy', this.getObject(vgpu).$ref)
  },
}
