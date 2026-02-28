import { describe, it, expect } from 'vitest'
import { parse } from '../src/index.js'

describe('Query Language Parser', () => {
  it('should parse a simple equality expression', () => {
    const inputText = 'field eq \'value\''
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'Comparison',
      operator: 'eq',
      identifier: 'field',
      value: 'value'
    })
  })

  it('should parse a simple numeric expression', () => {
    const inputText = 'field gte 123.45'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'Comparison',
      operator: 'gte',
      identifier: 'field',
      value: '123.45'
    })
  })

  it('should parse a simple boolean expression', () => {
    const inputText = 'field eq true'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'Comparison',
      operator: 'eq',
      identifier: 'field',
      value: true
    })
  })

  it('should parse a simple null expression', () => {
    const inputText = 'field eq null'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'Comparison',
      operator: 'eq',
      identifier: 'field',
      value: null
    })
  })

  it('should parse an "and" expression', () => {
    const inputText = 'field1 eq \'value1\' and field2 lt 10'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'BinaryExpression',
      operator: 'and',
      left: {
        type: 'Comparison',
        operator: 'eq',
        identifier: 'field1',
        value: 'value1'
      },
      right: {
        type: 'Comparison',
        operator: 'lt',
        identifier: 'field2',
        value: '10'
      }
    })
  })

  it('should parse an "or" expression', () => {
    const inputText = 'field1 eq \'value1\' or field2 gt 10'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'BinaryExpression',
      operator: 'or',
      left: {
        type: 'Comparison',
        operator: 'eq',
        identifier: 'field1',
        value: 'value1'
      },
      right: {
        type: 'Comparison',
        operator: 'gt',
        identifier: 'field2',
        value: '10'
      }
    })
  })

  it('should handle operator precedence (and before or)', () => {
    const inputText = 'a eq 1 or b eq 2 and c eq 3'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'BinaryExpression',
      operator: 'or',
      left: {
        type: 'Comparison',
        operator: 'eq',
        identifier: 'a',
        value: '1'
      },
      right: {
        type: 'BinaryExpression',
        operator: 'and',
        left: {
          type: 'Comparison',
          operator: 'eq',
          identifier: 'b',
          value: '2'
        },
        right: {
          type: 'Comparison',
          operator: 'eq',
          identifier: 'c',
          value: '3'
        }
      }
    })
  })

  it('should handle parenthesis to override precedence', () => {
    const inputText = '(a eq 1 or b eq 2) and c eq 3'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'BinaryExpression',
      operator: 'and',
      left: {
        type: 'BinaryExpression',
        operator: 'or',
        left: {
          type: 'Comparison',
          operator: 'eq',
          identifier: 'a',
          value: '1'
        },
        right: {
          type: 'Comparison',
          operator: 'eq',
          identifier: 'b',
          value: '2'
        }
      },
      right: {
        type: 'Comparison',
        operator: 'eq',
        identifier: 'c',
        value: '3'
      }
    })
  })

  it('should parse a "not" expression', () => {
    const inputText = 'not (field eq \'value\')'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'UnaryExpression',
      operator: 'not',
      argument: {
        type: 'Comparison',
        operator: 'eq',
        identifier: 'field',
        value: 'value'
      }
    })
  })

  it('should parse an "in" expression', () => {
    const inputText = 'field in (\'a\', \'b\', \'c\')'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'In',
      identifier: 'field',
      values: ['a', 'b', 'c']
    })
  })

  it('should parse an "is null" expression', () => {
    const inputText = 'field is null'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'NullCheck',
      operator: 'is null',
      identifier: 'field'
    })
  })

  it('should parse an "is not null" expression', () => {
    const inputText = 'field is not null'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'NullCheck',
      operator: 'is not null',
      identifier: 'field'
    })
  })

  it('should parse a "like" expression', () => {
    const inputText = 'field like \'value%\''
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).toEqual([])
    expect(ast).toEqual({
      type: 'Like',
      identifier: 'field',
      value: 'value%'
    })
  })

  it('should return an error for an invalid expression', () => {
    const inputText = 'field eq'
    const { ast, lexErrors, parseErrors } = parse(inputText)

    expect(lexErrors).toEqual([])
    expect(parseErrors).not.toEqual([])
    expect(ast).toBeNull()
  })
})
