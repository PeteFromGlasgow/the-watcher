import { CstParser } from 'chevrotain'
import {
  allTokens,
  And,
  BooleanLiteral,
  Comma,
  Eq,
  Gt,
  Gte,
  Identifier,
  In,
  Is,
  Like,
  LParen,
  Lt,
  Lte,
  Neq,
  Not,
  NullLiteral,
  NumericLiteral,
  Or,
  RParen,
  StringLiteral
} from './tokens.js'

export class QueryParser extends CstParser {
  constructor() {
    super(allTokens)
    this.performSelfAnalysis()
  }

  public query = this.RULE('query', () => {
    this.SUBRULE(this.expression)
  })

  private expression = this.RULE('expression', () => {
    this.SUBRULE(this.orExpression, { LABEL: 'lhs' })
  })

  private orExpression = this.RULE('orExpression', () => {
    this.SUBRULE(this.andExpression, { LABEL: 'lhs' })
    this.MANY(() => {
      this.CONSUME(Or)
      this.SUBRULE2(this.andExpression, { LABEL: 'rhs' })
    })
  })

  private andExpression = this.RULE('andExpression', () => {
    this.SUBRULE(this.notExpression, { LABEL: 'lhs' })
    this.MANY(() => {
      this.CONSUME(And)
      this.SUBRULE2(this.notExpression, { LABEL: 'rhs' })
    })
  })

  private notExpression = this.RULE('notExpression', () => {
    this.OPTION(() => {
      this.CONSUME(Not)
    })
    this.SUBRULE(this.atomicExpression)
  })

  private atomicExpression = this.RULE('atomicExpression', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.parenthesisExpression) },
      { ALT: () => this.SUBRULE(this.condition) }
    ])
  })

  private parenthesisExpression = this.RULE('parenthesisExpression', () => {
    this.CONSUME(LParen)
    this.SUBRULE(this.expression)
    this.CONSUME(RParen)
  })

  private condition = this.RULE('condition', () => {
    this.CONSUME(Identifier)
    this.OR([
      { ALT: () => this.SUBRULE(this.binaryCondition) },
      { ALT: () => this.SUBRULE(this.inCondition) },
      { ALT: () => this.SUBRULE(this.nullCondition) },
      { ALT: () => this.SUBRULE(this.likeCondition) }
    ])
  })

  private binaryCondition = this.RULE('binaryCondition', () => {
    this.SUBRULE(this.comparisonOperator)
    this.SUBRULE(this.literal)
  })

  private likeCondition = this.RULE('likeCondition', () => {
    this.CONSUME(Like)
    this.CONSUME(StringLiteral)
  })

  private inCondition = this.RULE('inCondition', () => {
    this.CONSUME(In)
    this.CONSUME(LParen)
    this.AT_LEAST_ONE_SEP({
      SEP: Comma,
      DEF: () => {
        this.SUBRULE(this.literal)
      }
    })
    this.CONSUME(RParen)
  })

  private nullCondition = this.RULE('nullCondition', () => {
    this.CONSUME(Is)
    this.OPTION(() => {
      this.CONSUME(Not)
    })
    this.CONSUME(NullLiteral)
  })

  private literal = this.RULE('literal', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumericLiteral) },
      { ALT: () => this.CONSUME(BooleanLiteral) },
      { ALT: () => this.CONSUME(NullLiteral) }
    ])
  })

  private comparisonOperator = this.RULE('comparisonOperator', () => {
    this.OR([
      { ALT: () => this.CONSUME(Eq) },
      { ALT: () => this.CONSUME(Neq) },
      { ALT: () => this.CONSUME(Gt) },
      { ALT: () => this.CONSUME(Gte) },
      { ALT: () => this.CONSUME(Lt) },
      { ALT: () => this.CONSUME(Lte) }
    ])
  })
}

export const parser = new QueryParser()
