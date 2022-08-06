export interface withExecutionResult<T> {
  time: number
  result: T
}

export function humanFileSize (size: number): string {
  if (!size) {
    return '0b'
  }

  const i = Math.floor(Math.log(size) / Math.log(1024))

  return Math.round((size / Math.pow(1024, i)) * 100) / 100 + ['b', 'kb', 'mb', 'gb', 'tb'][i]
}

export function withExecutionTime<T> (cb: () => T): withExecutionResult<T> {
  const startTime = Date.now()
  const result = cb()

  return {
    time: Date.now() - startTime,
    result
  }
}
