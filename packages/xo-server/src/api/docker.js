export async function register({ vm }) {
  await this.getXapi(vm).registerDockerContainer(vm._xapiId)
}
register.description = 'Register the VM for Docker management'

register.params = {
  vm: { type: 'string' },
}

register.resolve = {
  vm: ['vm', 'VM', 'administrate'],
}

// -----------------------------------------------------------------------------

export async function deregister({ vm }) {
  await this.getXapi(vm).unregisterDockerContainer(vm._xapiId)
}
deregister.description = 'Deregister the VM for Docker management'

deregister.params = {
  vm: { type: 'string' },
}

deregister.resolve = {
  vm: ['vm', 'VM', 'administrate'],
}

// -----------------------------------------------------------------------------

export async function start({ vm, container }) {
  await this.getXapi(vm).startDockerContainer(vm._xapiId, container)
}

export async function stop({ vm, container }) {
  await this.getXapi(vm).stopDockerContainer(vm._xapiId, container)
}

export async function restart({ vm, container }) {
  await this.getXapi(vm).restartDockerContainer(vm._xapiId, container)
}

export async function pause({ vm, container }) {
  await this.getXapi(vm).pauseDockerContainer(vm._xapiId, container)
}

export async function unpause({ vm, container }) {
  await this.getXapi(vm).unpauseDockerContainer(vm._xapiId, container)
}

for (const fn of [start, stop, restart, pause, unpause]) {
  fn.params = {
    vm: { type: 'string' },
    container: { type: 'string' },
  }

  fn.resolve = {
    vm: ['vm', 'VM', 'operate'],
  }
}
