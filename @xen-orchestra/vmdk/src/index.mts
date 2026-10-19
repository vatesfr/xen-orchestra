export {
  ConsumerVmdkStreamOptimized,
  toVmdkStream,
  type ConsumerVmdkStreamOptimizedOptions,
  type VmdkLayout,
  type WithLength,
} from './consumer/ConsumerVmdkStreamOptimized.mjs'
export { computeGeometry, createStreamOptimizedDescriptor, type VmdkGeometry } from './_descriptor.mjs'
export { packStreamOptimizedHeader, unpackSparseHeader, type VmdkSparseHeader } from './_header.mjs'
