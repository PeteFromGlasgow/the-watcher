import { describe, expect, it } from 'vitest'
import { getProgram } from '../src/cli.js'

describe('Command hello-world <name>', () => {
  it('Should return "Hello George!" when given "George" as an argument', async () => {
    let result: string | null = null
    const program = await getProgram(i => result = (i as string))
    await program.parseAsync(['node', 'src/app.js', 'hello-world', 'George'])
    expect(result).to.equal('Hello George!')
  })
})
