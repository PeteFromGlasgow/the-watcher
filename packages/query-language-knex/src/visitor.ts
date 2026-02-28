import { Knex } from 'knex'

type Value = string | number | boolean | null

interface BinaryExpression {
  type: 'BinaryExpression'
  operator: 'and' | 'or'
  left: AstNode
  right: AstNode
}

interface UnaryExpression {
  type: 'UnaryExpression'
  operator: 'not'
  argument: AstNode
}

interface Comparison {
  type: 'Comparison'
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  identifier: string
  value: Value
}

interface Like {
  type: 'Like'
  identifier: string
  value: string
}

interface In {
  type: 'In'
  identifier: string
  values: Value[]
}

interface NullCheck {
  type: 'NullCheck'
  operator: 'is null' | 'is not null'
  identifier: string
}

type AstNode
  = | BinaryExpression
    | UnaryExpression
    | Comparison
    | In
    | NullCheck
    | Like

const comparisonOperatorMap = {
  eq: '=',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'like'
}

export class KnexVisitor {
  constructor(private qb: Knex.QueryBuilder) {}

  visit(node: AstNode): Knex.QueryBuilder {
    switch (node.type) {
      case 'BinaryExpression':
        this.visitBinaryExpression(node)
        break
      case 'UnaryExpression':
        this.visitUnaryExpression(node)
        break
      case 'Comparison':
        this.visitComparison(node)
        break
      case 'Like':
        this.visitLike(node)
        break
      case 'In':
        this.visitIn(node)
        break
      case 'NullCheck':
        this.visitNullCheck(node)
        break
    }
    return this.qb
  }

  private visitBinaryExpression(node: BinaryExpression) {
    if (node.operator === 'or') {
      this.qb.where(function () {
        new KnexVisitor(this).visit(node.left)
      })
      this.qb.orWhere(function () {
        new KnexVisitor(this).visit(node.right)
      })
    } else {
      // AND
      this.qb.where(function () {
        new KnexVisitor(this).visit(node.left)
        new KnexVisitor(this).visit(node.right)
      })
    }
  }

  private visitUnaryExpression(node: UnaryExpression) {
    this.qb.whereNot(function () {
      new KnexVisitor(this).visit(node.argument)
    })
  }

  private visitComparison(node: Comparison) {
    const operator = comparisonOperatorMap[node.operator]
    const value = node.value
    this.qb.where(node.identifier, operator, value)
  }

  private visitLike(node: Like) {
    this.qb.where(node.identifier, 'like', node.value)
  }

  private visitIn(node: In) {
    this.qb.whereIn(node.identifier, node.values)
  }

  private visitNullCheck(node: NullCheck) {
    if (node.operator === 'is null') {
      this.qb.whereNull(node.identifier)
    } else {
      this.qb.whereNotNull(node.identifier)
    }
  }
}
