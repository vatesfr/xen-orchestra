import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'

// The shared mocks the V2V wizard steps read: resetting one a test file does not mock is harmless
export function resetV2vCollectionMocks() {
  v2vVmRowsCollectionsMock.reset()
  destinationCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()
  deleteModalMock.reset()
}
