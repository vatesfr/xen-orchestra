async function delete_ ({message}) {
  await this.getXAPI(message).call('message.destroy', message.ref)
}
export {delete_ as delete}

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  message: ['id', 'message', 'administrate']
}
