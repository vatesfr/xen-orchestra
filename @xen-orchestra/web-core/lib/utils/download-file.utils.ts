export function downloadFile(url: string, downloadName: string, openInNewTab: boolean = true) {
  const link = document.createElement('a')
  link.href = url
  link.download = downloadName

  if (openInNewTab) {
    link.target = '_blank'
  }

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
