const formatCounter = counter => String(counter).padStart(8, '0')

export const formatBlockPath = (basePath, counter) => `${basePath}/${formatCounter(counter)}`
