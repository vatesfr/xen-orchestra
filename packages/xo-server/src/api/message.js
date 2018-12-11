async function delete_({ message }) {
  await this.getXapi(message).call('message.destroy', message._xapiRef)
}
export { delete_ as delete }

delete_.params = {
  id: { type: 'string' },
}

delete_.resolve = {
  message: ['id', 'message', 'administrate'],
}
