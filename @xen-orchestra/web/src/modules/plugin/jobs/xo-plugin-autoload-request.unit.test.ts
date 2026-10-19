import { syncPluginAutoload, updatePluginAutoload } from '@/modules/plugin/jobs/xo-plugin-autoload-request.ts'
import { createPlugin } from '@/test/create-plugin.ts'

const { fetchPatch } = vi.hoisted(() => ({
  fetchPatch: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), async importOriginal => ({
  ...(await importOriginal()),
  fetchPatch,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  fetchPatch.mockReset().mockResolvedValue(undefined)
})

describe('updatePluginAutoload', () => {
  it('updates the autoload of the plugin', async () => {
    await updatePluginAutoload(createPlugin(), false)

    expect(fetchPatch).toHaveBeenCalledWith('plugins/transport-email', { autoload: false })
  })

  it('propagates the error of the request', async () => {
    const error = new Error('autoload update failed')
    fetchPatch.mockRejectedValue(error)

    await expect(updatePluginAutoload(createPlugin(), true)).rejects.toBe(error)
  })
})

describe('syncPluginAutoload', () => {
  it('updates the autoload of the plugin', async () => {
    await syncPluginAutoload(createPlugin(), true)

    expect(fetchPatch).toHaveBeenCalledWith('plugins/transport-email', { autoload: true })
  })

  it('does not fail when the update fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchPatch.mockRejectedValue(new Error('autoload update failed'))

    await expect(syncPluginAutoload(createPlugin(), true)).resolves.toBeUndefined()
  })
})
