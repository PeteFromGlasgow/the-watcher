import { createToken, Lexer } from 'chevrotain'

// Define Tokens
export const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z]\w*/ })

export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"[^"]*"|'[^']*'/
})

export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

export const LParen = createToken({ name: 'LParen', pattern: /\(/ })
export const RParen = createToken({ name: 'RParen', pattern: /\)/ })
export const Comma = createToken({ name: 'Comma', pattern: /,/ })

// Operators
export const Eq = createToken({ name: 'Eq', pattern: /eq/ })
export const Neq = createToken({ name: 'Neq', pattern: /neq/ })
export const Gt = createToken({ name: 'Gt', pattern: /gt/ })
export const Gte = createToken({ name: 'Gte', pattern: /gte/ })
export const Lt = createToken({ name: 'Lt', pattern: /lt/ })
export const Lte = createToken({ name: 'Lte', pattern: /lte/ })
export const And = createToken({ name: 'And', pattern: /and/ })
export const Or = createToken({ name: 'Or', pattern: /or/ })
export const Not = createToken({ name: 'Not', pattern: /not/ })
export const In = createToken({ name: 'In', pattern: /in/ })
export const Is = createToken({ name: 'Is', pattern: /is/ })
export const Like = createToken({ name: 'Like', pattern: /like/ })

// Literals
export const NullLiteral = createToken({ name: 'NullLiteral', pattern: /null/ })
export const BooleanLiteral = createToken({ name: 'BooleanLiteral', pattern: /true|false/ })
export const NumericLiteral = createToken({ name: 'NumericLiteral', pattern: /-?\d+(\.\d+)?/ })

export const allTokens = [
  WhiteSpace,
  LParen,
  RParen,
  Comma,

  // Longer alternatives must be placed before shorter alternatives.
  // e.g. 'gte' before 'gt'
  Gte,
  Lte,

  // The rest of the operators
  Is,
  Eq,
  Neq,
  Gt,
  Lt,
  And,
  Or,
  Not,
  In,
  Like,

  // Keyword literals must come before the generic Identifier
  NullLiteral,
  BooleanLiteral,

  // The generic Identifier must be last among keywords/literals
  Identifier,

  // Other literals
  StringLiteral,
  NumericLiteral
]
