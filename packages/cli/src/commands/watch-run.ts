import { Command } from 'commander'

// TODO: WCH-6 — Implement watch-run command to trigger a run for a watch
export function registerWatchRun(program: Command) {
  program
    .command('watch-run <watchId>')
    .description('Trigger a run for the given watch')
    .action((_watchId) => {
      // placeholder
    })
}
