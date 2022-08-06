import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createJson, tmpDirectory } from '../../fs-helpers'
import { processCompilerOptions, readTsConfig } from '../../../src/core/ts-config'
import { DirectoryResult } from 'tmp-promise'

let cwd!: DirectoryResult

beforeEach(async () => {
  // create temporary cwd directory
  cwd = await tmpDirectory()
})

afterEach(async () => {
  // clean temporary cwd directory
  await cwd.cleanup()
})

describe('readTsConfig', () => {
  it('throws error in no tsconfig file found', async () => {
    expect(() => readTsConfig('tsconfig.json', cwd.path)).toThrow('No \'tsconfig.json\' file found')
  })

  it('throw error on invalid tsconfig file', async () => {
    // create tsconfig file
    await createJson(path.resolve(cwd.path, 'tsconfig.json'), '')

    expect(() => readTsConfig('tsconfig.json', cwd.path)).toThrow('Error while parsing \'tsconfig.json\' file')
  })

  it('properly read non extended tsconfig file', async () => {
    // create tsconfig file
    await createJson(path.resolve(cwd.path, 'tsconfig.json'), {
      compilerOptions: {
        module: 'commonjs'
      },
      include: [
        'src/**/*.ts'
      ]
    })

    const config = await readTsConfig('tsconfig.json', cwd.path)

    expect(config.include).toStrictEqual(['src/**/*.ts'])
    expect(config.compilerOptions?.module).toBe('commonjs')
  })

  it('properly read extended tsconfig file', async () => {
    // create base tsconfig file
    await createJson(path.resolve(cwd.path, 'tsconfig.base.json'), {
      compilerOptions: {
        module: 'commonjs'
      },
      include: [
        'root/**/*.ts'
      ]
    })

    // create base tsconfig file
    await createJson(path.resolve(cwd.path, 'tsconfig.json'), {
      extends: './tsconfig.base.json',
      include: [
        'src/**/*.ts'
      ]
    })

    const config = await readTsConfig('tsconfig.json', cwd.path)

    expect(config.include).toStrictEqual(['src/**/*.ts'])
    expect(config.compilerOptions?.module).toBe('commonjs')
    expect(config.extends).toBeUndefined()
  })
})

describe('processCompilerOptions', () => {
  it('throw error on invalid tsconfig file', async () => {
    // create tsconfig file
    await createJson(path.resolve(cwd.path, 'tsconfig.json'), {
      compilerOptions: {
        module: 'invalid'
      }
    })

    const config = readTsConfig('tsconfig.json', cwd.path)

    expect(() => processCompilerOptions(config, 'tsconfig.json', cwd.path)).toThrow('Error while parsing \'tsconfig.json\' file')
  })

  it('properly process compiler options tsconfig file', async () => {
    // create tsconfig file
    await createJson(path.resolve(cwd.path, 'tsconfig.json'), {
      compilerOptions: {
        module: 'commonjs'
      },
      include: [
        'src/**/*.ts'
      ]
    })

    const config = await readTsConfig('tsconfig.json', cwd.path)

    const compilerOptions = await processCompilerOptions(config, 'tsconfig.json', cwd.path)

    expect(compilerOptions.module).toBe(1)
  })
})
