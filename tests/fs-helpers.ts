import tmp from 'tmp-promise'
import fs from 'fs/promises'

export async function tmpDirectory (): Promise<tmp.DirectoryResult> {
  return tmp.dir({ unsafeCleanup: true })
}

export async function createJson (filePath: string, content: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8')
}
