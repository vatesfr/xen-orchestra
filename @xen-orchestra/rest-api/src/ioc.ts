import { Container } from 'inversify'
import DashboardService from './dashboard/dashboard.service.js'
import { DashboardController } from './dashboard/dashboard.controller.js'
import { EventsController } from './events/event.controller.js'
import { ServersController } from './servers/server.controller.js'
import { VmsController } from './vms/vm.controller.js'

const iocContainer = new Container()

// all controller need to be added here
// maybe automate here?
// maybe we can use abstract class here do define classique crud?
iocContainer.bind(DashboardService).toSelf().inSingletonScope()
iocContainer.bind(DashboardController).toSelf().inSingletonScope()
iocContainer.bind(ServersController).toSelf().inSingletonScope()
iocContainer.bind(EventsController).toSelf().inSingletonScope()
iocContainer.bind(VmsController).toSelf().inSingletonScope()

export { iocContainer }
