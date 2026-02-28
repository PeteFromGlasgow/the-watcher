import { ILexingError, IRecognitionException, Lexer } from 'chevrotain'
import { allTokens } from './tokens.js'
import { QueryParser, parser } from './parser.js'
import { QueryVisitor, visitor } from './visitor.js'
import { ArrayFilterVisitor } from './array-filter-visitor.js'

const lexer = new Lexer(allTokens)
const arrayFilterVisitor = new ArrayFilterVisitor()

export function executeQuery(
  query: string,
  data: Record<string, unknown>[]
) {
  const { ast, lexErrors, parseErrors } = parse(query)

  if (lexErrors.length > 0 || parseErrors.length > 0 || !ast) {
    return {
      data: null,
      lexErrors,
      parseErrors
    }
  }

  const filterFn = arrayFilterVisitor.visit(ast)
  return {
    ast,
    data: data.filter(filterFn as (value: Record<string, unknown>) => boolean),
    lexErrors,
    parseErrors
  }
}

export function parse(text: string) {
  const lexingResult = lexer.tokenize(text)
  parser.input = lexingResult.tokens
  const cst = parser.query()

  if (parser.errors.length > 0) {
    return {
      ast: null,
      lexErrors: lexingResult.errors,
      parseErrors: parser.errors
    }
  }

  const ast = visitor.visit(cst)

  return {
    ast,
    lexErrors: lexingResult.errors,
    parseErrors: parser.errors
  }
}

export * from './tokens.js'
export { ILexingError, IRecognitionException, Lexer }
export { QueryParser }
export { QueryVisitor }
