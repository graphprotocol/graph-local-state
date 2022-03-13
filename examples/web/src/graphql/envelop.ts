import { envelop, useSchema, useExtendContext } from '@envelop/core'
import { useParserCache } from '@envelop/parser-cache'
import { useValidationCache } from '@envelop/validation-cache'
import { buildContext } from './context'
import mySchema from './schema'

export default envelop({
  plugins: [
    // Something is wrong here :/
    useExtendContext(() => buildContext()),
    useSchema(mySchema),
    useParserCache(),
    useValidationCache(),
  ],
})
