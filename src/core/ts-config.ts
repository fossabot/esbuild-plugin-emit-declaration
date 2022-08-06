import tsc from 'typescript'

export interface TsConfig {
  [key: string]: string | number | Array<unknown> | Record<string, unknown> | undefined

  compilerOptions?: tsc.CompilerOptions
}

export function readTsConfig (configName?: string, cwd?: string): TsConfig {
  configName = configName || 'tsconfig.json'
  cwd = cwd || process.cwd()

  // find tsconfig.json path
  const configPath = tsc.findConfigFile(cwd, tsc.sys.fileExists, configName)
  if (!configPath) {
    throw new Error(`No '${configName}' file found`)
  }

  // parse tsconfig.json
  const { config, error } = tsc.readConfigFile(configPath, tsc.sys.readFile)
  if (error) {
    throw new Error(`Error while parsing '${configName}' file`)
  }

  // check if extends
  if (config.extends) {
    const extendedConfig = readTsConfig(config.extends, cwd)

    // merge compilerOptions
    if (extendedConfig.compilerOptions) {
      config.compilerOptions = {
        ...extendedConfig.compilerOptions,
        ...config.compilerOptions
      }
    }

    delete config.extends
  }

  return config
}

export function processCompilerOptions (config: TsConfig, configName?: string, cwd?: string) {
  configName = configName || 'tsconfig.json'
  cwd = cwd || process.cwd()

  // create compiler options from parsed tsconfig.json
  const { options, errors } = tsc.convertCompilerOptionsFromJson(config.compilerOptions, cwd)
  if (errors.length > 0) {
    throw new Error(`Error while parsing '${configName}' file`)
  }

  return options
}
