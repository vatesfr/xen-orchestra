export function downloadFile(url: string, downloadName: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = downloadName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
