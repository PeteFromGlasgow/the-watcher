import {
  ILexingError,
  IRecognitionException,
  parse
} from '@in-the-black/query-language'
import { Knex } from 'knex'
import { KnexVisitor } from './visitor.js'

export class QueryError extends Error {
  constructor(
    message: string,
    public lexErrors: ILexingError[],
    public parseErrors: IRecognitionException[]
  ) {
    super(message)
    this.name = 'QueryError'
  }
}

export const applyQuery = (qb: Knex.QueryBuilder, query: string) => {
  const { ast, lexErrors, parseErrors } = parse(query)
  if (lexErrors.length > 0 || parseErrors.length > 0 || !ast) {
    throw new QueryError('Invalid query', lexErrors, parseErrors)
  }

  const visitor = new KnexVisitor(qb)
  return visitor.visit(ast)
}
