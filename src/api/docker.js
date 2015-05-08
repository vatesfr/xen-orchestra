export async function register ({vm}) {
  await this.getXAPI(vm).registerDockerContainer(vm.id)
}
register.permission = 'admin'

register.description = 'Register the VM for Docker management'

register.params = {
  vm: { type: 'string' },
}

register.resolve = {
  vm: ['vm', 'VM']
}

//------------------------------------------------------------------------------
export async function unregister ({vm}) {
  await this.getXAPI(vm).unregisterDockerContainer(vm.id)
}
unregister.permission = 'admin'

unregister.description = 'Unregister the VM for Docker management'

unregister.params = {
  vm: { type: 'string' },
}

unregister.resolve = {
  vm: ['vm', 'VM']
}

//------------------------------------------------------------------------------
export async function start ({vm, container}) {
  await this.getXAPI(vm).startDockerContainer(vm.id, container)
}

export async function stop ({vm, container}) {
  await this.getXAPI(vm).stopDockerContainer(vm.id, container)
}

export async function restart ({vm, container}) {
  await this.getXAPI(vm).restartDockerContainer(vm.id, container)
}

export async function pause ({vm, container}) {
  await this.getXAPI(vm).pauseDockerContainer(vm.id, container)
}

export async function unpause ({vm, container}) {
  await this.getXAPI(vm).unpauseDockerContainer(vm.id, container)
}

for (let fn of [start, stop, restart, pause, unpause]) {
  fn.permission = 'admin'

  fn.params = {
    vm: { type: 'string' },
    container: { type: 'string' }
  }

  fn.resolve = {
    vm: ['vm', 'VM']
  }
}
