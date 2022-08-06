import path from 'path'
import ts from 'typescript'
import { PluginBuild } from 'esbuild'
import { processCompilerOptions, readTsConfig, TsConfig } from './ts-config'
import { withExecutionTime } from '../utils/helpers'
import {
  outputDoneMessage,
  outputEmitMessage,
  outputWatchCompilerEmit,
  outputWatchCompilerStatus
} from '../utils/output'

export type TsWatchCompilerHost = ts.WatchCompilerHostOfFilesAndCompilerOptions<ts.BuilderProgram>
export type TsCompilerHost = ts.CompilerHost
export type TsWatchCompilerProgram = ts.BuilderProgram
export type TsCompilerProgram = ts.Program | ts.BuilderProgram
export type TsWatchEmitCallback = (emittedFile: string) => void
export type TsWatchStatusCallback = (diagnostic: ts.Diagnostic) => void

export enum TsWatchDiagnostic {
  STARTING_COMPILATION = 6031,
  CHANGE_DETECTED = 6032,
  COMPILATION_ENDED = 6194
}

export interface TsCompilerOptions {
  cwd: string
  outDir?: string
  tsConfig?: string
  incremental?: boolean
}

export class TsCompiler {
  protected readonly build: PluginBuild
  protected readonly options: Required<TsCompilerOptions>
  protected readonly config: TsConfig
  protected readonly compilerOptions: ts.CompilerOptions

  protected isWatching: boolean

  constructor (build: PluginBuild, options: TsCompilerOptions) {
    this.build = build
    this.options = {
      cwd: options.cwd,
      outDir: 'dist',
      tsConfig: options.tsConfig || 'tsconfig.json',
      incremental: !!options.incremental
    }
    this.config = readTsConfig(this.options.tsConfig, this.options.cwd)
    this.compilerOptions = processCompilerOptions(this.config, this.options.tsConfig, this.options.cwd)
    this.isWatching = false

    this.adaptCompilerOptions()
  }

  public emit (): void {
    console.log('\nEmitting declaration files ...\n')

    const compilerProgram = this.createCompilerProgram()
    const { time, result } = withExecutionTime(compilerProgram.emit)

    outputEmitMessage(result, this.options)

    outputDoneMessage(time)
  }

  public watch (): void {
    if (this.isWatching) {
      return
    }

    const emitCallback: TsWatchEmitCallback = (emittedFile => {
      if (!this.isWatching) {
        return
      }

      if (!emittedFile.startsWith('TSFILE: ')) {
        return
      }

      outputWatchCompilerEmit(emittedFile.replace('TSFILE: ', '').trim(), this.options)
    })

    const statusCallback: TsWatchStatusCallback = (diagnostic => {
      if (diagnostic.code === TsWatchDiagnostic.COMPILATION_ENDED && !this.isWatching) {
        outputWatchCompilerStatus('declaration files emitted, watching for changes...')
      } else if (diagnostic.code === TsWatchDiagnostic.CHANGE_DETECTED && this.isWatching) {
        outputWatchCompilerStatus('emit declaration started')
      }
    })

    this.createWatchCompilerProgram(emitCallback, statusCallback)
    this.isWatching = true
  }

  protected get entryPoints (): Array<string> {
    if (!this.build.initialOptions.entryPoints) {
      return []
    }

    if (Array.isArray(this.build.initialOptions.entryPoints)) {
      return this.build.initialOptions.entryPoints
    }

    return Object.values(this.build.initialOptions.entryPoints)
  }

  protected adaptCompilerOptions () {
    // enable emitting declaration
    this.compilerOptions.declaration = true
    this.compilerOptions.emitDeclarationOnly = true
    this.compilerOptions.declarationDir = this.build.initialOptions.outdir || this.options.outDir

    // enable listing emitted files for diagnostics
    this.compilerOptions.listEmittedFiles = true

    // incremental build
    if (this.options.incremental) {
      this.compilerOptions.incremental = true
      this.compilerOptions.tsBuildInfoFile = path.resolve(this.options.outDir, 'tsconfig.tsbuildinfo')
    }
  }

  protected createCompilerProgram (): TsCompilerProgram {
    const compilerHost = this.createCompilerHost()

    if (this.options.incremental) {
      return ts.createIncrementalProgram({
        rootNames: this.entryPoints,
        options: this.compilerOptions,
        host: compilerHost
      })
    } else {
      return ts.createProgram({
        rootNames: this.entryPoints,
        options: this.compilerOptions,
        host: compilerHost
      })
    }
  }

  protected createWatchCompilerProgram (emitCallback: TsWatchEmitCallback, statusCallback: TsWatchStatusCallback): TsWatchCompilerProgram {
    const compilerHost = this.createWatchCompilerHost(emitCallback, statusCallback)

    return ts.createWatchProgram(compilerHost).getProgram()
  }

  private createCompilerHost (): TsCompilerHost {
    if (this.options.incremental) {
      return ts.createIncrementalCompilerHost(this.options, ts.sys)
    } else {
      return ts.createCompilerHost(this.options)
    }
  }

  private createWatchCompilerHost (emitCallback: TsWatchEmitCallback, statusCallback: TsWatchStatusCallback): TsWatchCompilerHost {
    return ts.createWatchCompilerHost(
      this.entryPoints,
      this.compilerOptions,
      { ...ts.sys, write: emitCallback },
      undefined,
      () => {},
      statusCallback,
      [],
      {}
    )
  }
}
