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

type AstNode = BinaryExpression | UnaryExpression | Comparison | In | NullCheck | Like

type FilterFn = (record: Record<string, Value | Value[]>) => boolean

export class ArrayFilterVisitor {
  visit(node: AstNode): FilterFn {
    switch (node.type) {
      case 'BinaryExpression':
        return this.visitBinaryExpression(node)
      case 'UnaryExpression':
        return this.visitUnaryExpression(node)
      case 'Comparison':
        return this.visitComparison(node)
      case 'In':
        return this.visitIn(node)
      case 'NullCheck':
        return this.visitNullCheck(node)
      case 'Like':
        return this.visitLike(node)
    }
  }

  private visitBinaryExpression(node: BinaryExpression): FilterFn {
    const left = this.visit(node.left)
    const right = this.visit(node.right)

    if (node.operator === 'and') {
      return record => left(record) && right(record)
    } else {
      return record => left(record) || right(record)
    }
  }

  private visitUnaryExpression(node: UnaryExpression): FilterFn {
    const argument = this.visit(node.argument)
    return record => !argument(record)
  }

  private visitComparison(node: Comparison): FilterFn {
    return (record) => {
      const recordValue = record[node.identifier]
      if (node.value === null) {
        if (node.operator === 'eq') return recordValue === null
        if (node.operator === 'neq') return recordValue !== null
        return false
      }

      if (recordValue === null || recordValue === undefined) {
        return false
      }

      switch (node.operator) {
        case 'eq':
          if (Array.isArray(recordValue)) {
            return recordValue.includes(node.value)
          }
          return recordValue === node.value
        case 'neq':
          if (Array.isArray(recordValue)) {
            return !recordValue.includes(node.value)
          }
          return recordValue !== node.value
        case 'gt':
          return recordValue > node.value
        case 'gte':
          return recordValue >= node.value
        case 'lt':
          return recordValue < node.value
        case 'lte':
          return recordValue <= node.value
      }
    }
  }

  private visitLike(node: Like): FilterFn {
    return (record) => {
      const recordValue = record[node.identifier]
      if (typeof recordValue !== 'string' || typeof node.value !== 'string') {
        return false
      }
      const regex = new RegExp(`^${node.value.replace(/%/g, '.*')}$`)
      return regex.test(recordValue)
    }
  }

  private visitIn(node: In): FilterFn {
    return (record) => {
      const recordValue = record[node.identifier]
      if (Array.isArray(recordValue)) {
        return recordValue.some(v => node.values.includes(v))
      }
      return node.values.includes(recordValue)
    }
  }

  private visitNullCheck(node: NullCheck): FilterFn {
    return (record) => {
      const recordValue = record[node.identifier]
      if (node.operator === 'is null') {
        return recordValue === null
      } else {
        return recordValue !== null
      }
    }
  }
}
