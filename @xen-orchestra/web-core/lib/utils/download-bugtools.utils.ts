import { downloadFile } from './download-file.utils'

export function downloadBugTools(ip: string) {
  downloadFile(`http://${ip}/system-status?output=tar.bz2`, 'system-status.tar.bz2')
}
