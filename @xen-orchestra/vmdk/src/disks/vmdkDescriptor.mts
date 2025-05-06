export interface VMDKExtent {
  mode: string
  size: number
  type: string
  fileName: string
  offset?: number
}

export interface VMDKDescriptor {
  createType: string
  parentFileNameHint: string
  cid: string
  extents: VMDKExtent[]
}

/**
 * Parses a VMDK descriptor file and extracts key information
 * @param content The content of the VMDK descriptor file
 * @returns Parsed VMDK descriptor information
 */
export function parseVMDKDescriptor(content: string): VMDKDescriptor {
  const lines = content.split('\n')
  const result: Partial<VMDKDescriptor> = { extents: [] }

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    // Parse createType
    if (trimmed.startsWith('createType=')) {
      result.createType = trimmed.split('=')[1].replace(/"/g, '').trim()
    }

    // Parse parentFileNameHint
    else if (trimmed.startsWith('parentFileNameHint=')) {
      result.parentFileNameHint = trimmed.split('=')[1].replace(/"/g, '').trim()
    }

    // Parse CID
    else if (trimmed.startsWith('CID=')) {
      result.cid = trimmed.split('=')[1].trim()
    }

    // Parse extent description (non-comment line that starts with RW or RD, etc.)
    else if (/^([A-Z]+) ([0-9]+) ([A-Z]+) "(.*)" ?([0-9]*)$/.test(trimmed)) {
      const extentParts = trimmed.match(/^([A-Z]+) ([0-9]+) ([A-Z]+) "(.*)" ?([0-9]*)$/)
      if (extentParts && extentParts.length >= 5) {
        result.extents!.push({
          mode: extentParts[1],
          size: parseInt(extentParts[2], 10),
          type: extentParts[3],
          fileName: extentParts[4],
          offset: extentParts[5] ? parseInt(extentParts[5], 10) : undefined,
        })
      }
    }
  }

  if (!result.createType || !result.cid || !result.extents || result.extents.length === 0) {
    console.log({ result })
    throw new Error('Invalid VMDK descriptor file - missing required fields')
  }

  return result as VMDKDescriptor
}
