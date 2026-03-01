import { Command } from 'commander'
import { runWatch } from '@watcher/pipeline'

export function registerWatchRun(program: Command) {
  program
    .command('watch-run <watchId>')
    .description('Trigger a run for the given watch')
    .action(async (watchId: string) => {
      const result = await runWatch(watchId)
      console.log(JSON.stringify(result, null, 2))
      process.exit(result.errors.length > 0 ? 1 : 0)
    })
}
