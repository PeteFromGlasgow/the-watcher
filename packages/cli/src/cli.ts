import { Command } from 'commander'
import { getHelloWorld } from '@watcher/shared-logic'
import { registerWatchRun } from './commands/watch-run.js'

async function getProgram(output: (out: unknown) => void) {
  const program = new Command()
  const helloWorld = getHelloWorld(output as (message: string) => void)

  program
    .name('watcher')
    .description('The Watcher — property listing monitor CLI')
    .option('-a, --api-url <url>', 'API URL', process.env.WATCHER_API_URL || 'http://localhost:3000')

  program
    .command('hello-world <name>')
    .action(name => helloWorld(name))

  registerWatchRun(program)

  return program
}

export { getProgram }
