import { provide } from 'inversify-binding-decorators'
import { Controller, Get, Route, Tags } from 'tsoa'

interface PingResponse {
  status: string
  timestamp: number
}

@provide(PingController)
@Route('ping')
@Tags('health-check')
export class PingController extends Controller {
  @Get('')
  public async ping(): Promise<PingResponse> {
    return {
      status: 'health check OK',
      timestamp: Date.now(),
    }
  }
}
