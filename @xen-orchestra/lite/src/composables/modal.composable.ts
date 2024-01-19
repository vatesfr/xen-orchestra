import { useModalStore } from '@/stores/modal.store'
import type { AsyncComponentLoader } from 'vue'

export const useModal = <T>(loader: AsyncComponentLoader, props: object = {}) => useModalStore().open<T>(loader, props)
