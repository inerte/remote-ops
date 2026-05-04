import * as saveCodecsModule from '../generated/src/saveCodecs.mjs'

type SigilResult<TValue, TError> =
  | {
      readonly __fields: readonly [TValue]
      readonly __tag: 'Ok'
    }
  | {
      readonly __fields: readonly [TError]
      readonly __tag: 'Err'
    }

type SigilCodecError = {
  readonly message: string
  readonly path?: readonly string[]
}

interface SaveCodecsModule {
  readonly parseSaveFile: (
    input: string,
  ) => Promise<SigilResult<unknown, SigilCodecError>>
}

const saveCodecs = saveCodecsModule as unknown as SaveCodecsModule

const formatCodecPath = (path?: readonly string[]): string =>
  Array.isArray(path) && path.length > 0 ? ` at ${path.join('.')}` : ''

export const validateAutosavePayload = async (input: string): Promise<void> => {
  const result = await saveCodecs.parseSaveFile(input)
  if (result.__tag === 'Ok') {
    return
  }

  const error = result.__fields[0]
  throw new Error(`${error.message}${formatCodecPath(error.path)}`)
}
