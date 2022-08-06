import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import ts from 'typescript'
import { TsCompilerOptions } from '../core/ts-compiler'
import { humanFileSize } from './helpers'
import console from 'console'

export function outputWatchCompilerStatus (message: string) {
  console.log(chalk.white(`[watch] ${message}`))
}

export function outputWatchCompilerEmit (emittedFile: string, options: Required<TsCompilerOptions>) {
  if (emittedFile.endsWith('tsbuildinfo')) return

  const outFile = `${options.outDir}/${path.relative(options.outDir, emittedFile)}`

  console.log(chalk.white(`[watch] emit declaration finished (change: "${outFile}")`))
}

export function outputEmitMessage (emitResult: ts.EmitResult, options: Required<TsCompilerOptions>): void {
  emitResult.emittedFiles = emitResult.emittedFiles || []

  emitResult.emittedFiles.forEach(emittedFile => {
    const { size } = fs.statSync(emittedFile)
    const outDir = chalk.white.bold(options.outDir)
    const outFile = chalk.bold(path.relative(options.outDir, emittedFile))
    const fileSize = chalk.cyan(humanFileSize(size))

    console.log(`  ${outDir}/${outFile}  ${fileSize}`)
  })
}

export function outputDoneMessage (time: number): void {
  console.log('\n⚡ ' + chalk.green(`Done in ${time}ms`))
}
