// For a test expecting a failure the code under test logs: keeps the expected error out of the test output
export function silenceConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => {})
}
