import { describe, it, expect } from 'vitest'
import { executeQuery } from '../src/index.js'

describe('ArrayFilterVisitor', () => {
  const data = [
    { name: 'John', age: 30, city: 'New York', tags: ['a', 'b'], country: null },
    { name: 'Jane', age: 25, city: 'London', tags: ['b', 'c'] },
    { name: 'Jake', age: 40, city: 'New York', tags: ['c', 'd'] },
    { name: 'Jill', age: 35, city: 'Paris', tags: ['d', 'e'] }
  ]

  it('should handle simple equality', () => {
    const query = 'city eq \'New York\''
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('John')
    expect(result?.[1].name).toBe('Jake')
  })

  it('should handle "and" expressions', () => {
    const query = 'city eq \'New York\' and age gt 35'
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('Jake')
  })

  it('should handle "or" expressions', () => {
    const query = 'city eq \'London\' or city eq \'Paris\''
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('Jane')
    expect(result?.[1].name).toBe('Jill')
  })

  it('should handle "not" expressions', () => {
    const query = 'not city eq \'New York\''
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('Jane')
    expect(result?.[1].name).toBe('Jill')
  })

  it('should handle "in" expressions', () => {
    const query = 'city in (\'London\', \'Paris\')'
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('Jane')
    expect(result?.[1].name).toBe('Jill')
  })

  it('should handle "is null" expressions', () => {
    const query = 'country is null'
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('John')
  })

  it('should handle "is not null" expressions', () => {
    const query = 'country is not null'
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(3)
  })

  it('should handle "like" expressions', () => {
    const query = 'name like \'J%e\''
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('Jane')
    expect(result?.[1].name).toBe('Jake')
  })

  it('should handle parenthesis', () => {
    const query = '(city eq \'New York\' or city eq \'London\') and age lt 30'
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('Jane')
  })

  it('should handle querying for a value in an array field with eq', () => {
    const query = 'tags eq \'a\''
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('John')
  })

  it('should handle querying for a value not in an array field with neq', () => {
    const query = 'tags neq \'a\''
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(3)
  })

  it('should handle querying for multiple values in an array field with in', () => {
    const query = 'tags in (\'a\', \'e\')'
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('John')
    expect(result?.[1].name).toBe('Jill')
  })

  it('should return null for invalid queries', () => {
    const query = 'city eq'
    const { data: result, lexErrors, parseErrors } = executeQuery(query, data)
    expect(result).toBeNull()
    expect(lexErrors).toBeDefined()
    expect(parseErrors).toBeDefined()
  })

  it('should handle like with non-string values', () => {
    const query = 'age like \'3%\''
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(0)
  })

  it('should handle "eq null" comparison', () => {
    const query = 'country eq null'
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('John')
  })

  it('should handle "neq null" comparison', () => {
    const query = 'name neq null'
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(4)
  })

  it('should handle other comparisons with null', () => {
    const query = 'age gt null'
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(0)
  })

  it('should handle "gte" expressions', () => {
    const query = 'age gte 35'
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('Jake')
    expect(result?.[1].name).toBe('Jill')
  })

  it('should handle "lte" expressions', () => {
    const query = 'age lte 25'
    const { data: result, ast } = executeQuery(query, data)
    expect(ast).not.toBeNull()
    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('Jane')
  })
})
