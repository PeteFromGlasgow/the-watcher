# Query Language

This package provides a simple query language for filtering data.

## BNF Grammar

```
query ::= expression

expression ::= orExpression

orExpression ::= andExpression ( "or" andExpression )*

andExpression ::= notExpression ( "and" notExpression )*

notExpression ::= "not"? atomicExpression

atomicExpression ::= parenthesisExpression | condition

parenthesisExpression ::= "(" expression ")"

condition ::= IDENTIFIER ( binaryCondition | inCondition | nullCondition | likeCondition )

binaryCondition ::= comparisonOperator literal

inCondition ::= "in" "(" literal ( "," literal )* ")"

nullCondition ::= "is" "not"? "null"

likeCondition ::= "like" STRING

literal ::= STRING | NUMBER | "true" | "false" | "null"

comparisonOperator ::= "eq" | "neq" | "gt" | "gte" | "lt" | "lte"
```

## Examples

* `name eq "John Doe"`
* `age gt 30`
* `name eq "John Doe" and age gt 30`
* `name in ("John Doe", "Jane Doe")`
* `name is not null`
* `name like "John%"`
