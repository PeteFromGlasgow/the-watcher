import { describe, it, expect } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { bindField } from '../src/index.js'

describe('helloWorld', () => {
  it('Should return "Hello Ben!" when given "Ben" as an argument', async () => {
    const content = `
      <input id='in' type='text'></input>
      <div id='out'></div>
    `

    document.body.innerHTML = content

    bindField('in', 'out')
    const output = document.getElementById('out')

    await userEvent.type(document.querySelector('#in')!, 'Ben')
    expect(output?.innerHTML).to.equal('Hello Ben!')
  })
})
