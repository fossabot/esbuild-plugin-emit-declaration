import { Plugin, PluginBuild } from 'esbuild'
import { TsCompiler } from './core/ts-compiler'

export interface EmitDeclarationOptions {
  cwd?: string
  outDir?: string
  tsConfig?: string
  incremental?: boolean
}

export function esbuildPluginEmitDeclaration (opts: EmitDeclarationOptions = {}): Plugin {
  const options = {
    cwd: opts.cwd || process.cwd(),
    outDir: opts.outDir || 'dist',
    tsConfig: opts.tsConfig || 'tsconfig.json',
    incremental: !!opts.incremental
  } as Required<EmitDeclarationOptions>

  return {
    name: 'emit-declaration',

    setup (build: PluginBuild) {
      const compiler = new TsCompiler(build, {
        ...options
      })

      build.onEnd(result => {
        if (result.errors.length > 0) {
          return
        }

        if (!build.initialOptions.watch) {
          compiler.emit()
        } else {
          compiler.watch()
        }
      })
    }
  }
}

export default esbuildPluginEmitDeclaration
