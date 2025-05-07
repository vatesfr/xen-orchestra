import { XoServer } from '@vates/types'

export interface InsertableXoServer extends Pick<XoServer, 'host' | 'httpProxy' | 'label' | 'username'> {
  allowUnauthorized?: XoServer['allowUnauthorized']
  password: string
  readOnly?: XoServer['readOnly']
}
