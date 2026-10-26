import { syncPluginAutoload, updatePluginAutoload } from '@/modules/plugin/jobs/xo-plugin-autoload-request.ts'
import type { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'

const { patch } = vi.hoisted(() => ({
  patch: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPatch: patch as unknown as typeof fetchPatch,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  patch.mockReset()

  patch.mockResolvedValue(undefined)
})

describe('updatePluginAutoload', () => {
  it('updates the autoload of the plugin', async () => {
    await updatePluginAutoload(createPlugin(), false)

    expect(patch).toHaveBeenCalledWith('plugins/transport-email', { autoload: false })
  })

  it('propagates the error of the request', async () => {
    const error = new Error('autoload update failed')
    patch.mockRejectedValue(error)

    await expect(updatePluginAutoload(createPlugin(), true)).rejects.toBe(error)
  })
})

describe('syncPluginAutoload', () => {
  it('updates the autoload of the plugin', async () => {
    await syncPluginAutoload(createPlugin(), true)

    expect(patch).toHaveBeenCalledWith('plugins/transport-email', { autoload: true })
  })

  it('does not fail when the update fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    patch.mockRejectedValue(new Error('autoload update failed'))

    await expect(syncPluginAutoload(createPlugin(), true)).resolves.toBeUndefined()
  })
})
