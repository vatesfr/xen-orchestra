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
