import { build } from 'esbuild'
import path from 'path'
import minimist from 'minimist'
import { esbuildPluginNodeExternals } from 'esbuild-plugin-node-externals'

export const argv = minimist(process.argv.slice(2), {
  boolean: ['prod', 'watch']
})

await build({
  entryPoints: [path.resolve('src/index.ts')],
  outdir: path.resolve('dist'),
  watch: argv.watch,
  bundle: true,
  platform: 'node',
  target: ['node16'],
  plugins: [
    esbuildPluginNodeExternals({
      packagePaths: [path.resolve('package.json')]
    })
  ],
  logLevel: 'info',
  minify: argv.prod || false,
  treeShaking: true,
  define: {
    'process.env.NODE_ENV': JSON.stringify(argv.prod ? 'production' : 'development')
  }
})
