import { parser } from './parser.js'

import { CstNode, IToken } from 'chevrotain'

const CstVisitor = parser.getBaseCstVisitorConstructor()

interface CstNodeChildren {
  [key: string]: CstNode[] | IToken[]
}

export class QueryVisitor extends CstVisitor {
  constructor() {
    super()
    this.validateVisitor()
  }

  query(ctx: { expression: CstNode[] }) {
    return this.visit(ctx.expression)
  }

  expression(ctx: { lhs: CstNode[] }) {
    return this.visit(ctx.lhs)
  }

  orExpression(ctx: { lhs: CstNode[], rhs?: CstNode[] }) {
    let result = this.visit(ctx.lhs)

    if (ctx.rhs) {
      ctx.rhs.forEach((rhs) => {
        result = {
          type: 'BinaryExpression',
          operator: 'or',
          left: result,
          right: this.visit(rhs)
        }
      })
    }

    return result
  }

  andExpression(ctx: { lhs: CstNode[], rhs?: CstNode[] }) {
    let result = this.visit(ctx.lhs)

    if (ctx.rhs) {
      ctx.rhs.forEach((rhs) => {
        result = {
          type: 'BinaryExpression',
          operator: 'and',
          left: result,
          right: this.visit(rhs)
        }
      })
    }

    return result
  }

  notExpression(ctx: { atomicExpression: CstNode[], Not?: IToken[] }) {
    const expression = this.visit(ctx.atomicExpression)

    if (ctx.Not) {
      return {
        type: 'UnaryExpression',
        operator: 'not',
        argument: expression
      }
    }

    return expression
  }

  atomicExpression(ctx: { parenthesisExpression?: CstNode[], condition?: CstNode[] }) {
    if (ctx.parenthesisExpression) {
      return this.visit(ctx.parenthesisExpression)
    }
    return this.visit(ctx.condition as CstNode[])
  }

  parenthesisExpression(ctx: { expression: CstNode[] }) {
    return this.visit(ctx.expression)
  }

  condition(
    ctx: {
      Identifier: IToken[]
      binaryCondition?: CstNode[]
      inCondition?: CstNode[]
      nullCondition?: CstNode[]
      likeCondition?: CstNode[]
    }
  ) {
    const identifier = ctx.Identifier[0].image

    if (ctx.binaryCondition) {
      const { operator, value } = this.visit(ctx.binaryCondition)
      return {
        type: 'Comparison',
        operator,
        identifier,
        value
      }
    }

    if (ctx.inCondition) {
      const values = this.visit(ctx.inCondition)
      return {
        type: 'In',
        identifier,
        values
      }
    }

    if (ctx.nullCondition) {
      const operator = this.visit(ctx.nullCondition)
      return {
        type: 'NullCheck',
        operator,
        identifier
      }
    }

    if (ctx.likeCondition) {
      const value = this.visit(ctx.likeCondition)
      return {
        type: 'Like',
        identifier,
        value
      }
    }
  }

  binaryCondition(ctx: { comparisonOperator: CstNode[], literal: CstNode[] }) {
    const operator = this.visit(ctx.comparisonOperator)
    const value = this.visit(ctx.literal)
    return { operator, value }
  }

  likeCondition(ctx: { StringLiteral: IToken[] }) {
    return ctx.StringLiteral[0].image.slice(1, -1)
  }

  inCondition(ctx: { literal: CstNode[] }) {
    return ctx.literal.map(lit => this.visit(lit))
  }

  nullCondition(ctx: { Not?: IToken[] }) {
    if (ctx.Not) {
      return 'is not null'
    }
    return 'is null'
  }

  literal(ctx: CstNodeChildren) {
    if (ctx.StringLiteral) {
      return (ctx.StringLiteral[0] as IToken).image.slice(1, -1)
    }
    if (ctx.NumericLiteral) {
      return (ctx.NumericLiteral[0] as IToken).image
    }
    if (ctx.BooleanLiteral) {
      return (ctx.BooleanLiteral[0] as IToken).image === 'true'
    }
    if (ctx.NullLiteral) {
      return null
    }
  }

  comparisonOperator(ctx: CstNodeChildren) {
    if (ctx.Eq) return 'eq'
    if (ctx.Neq) return 'neq'
    if (ctx.Gt) return 'gt'
    if (ctx.Gte) return 'gte'
    if (ctx.Lt) return 'lt'
    if (ctx.Lte) return 'lte'
    if (ctx.Like) return 'like'
  }
}

export const visitor = new QueryVisitor()
