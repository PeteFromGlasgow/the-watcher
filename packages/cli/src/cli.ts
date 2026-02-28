import { Command } from 'commander'
import { getHelloWorld } from '@in-the-black/shared-logic'
import { registerCurrencies } from './commands/currencies.js'
import { readFile, writeFile } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'
import open from 'open'
import http from 'http'
import * as client from 'openid-client'
import { registerAccounts } from './commands/accounts.js'
import { registerAccountTypes } from './commands/accountTypes.js'

async function getJwt() {
  if (process.env.ITB_API_JWT) {
    return process.env.ITB_API_JWT
  }
  try {
    return await readFile(join(homedir(), '.itb-api-jwt'), 'utf-8')
  } catch (_e) {
    return undefined
  }
}

async function getProgram(output: (out: unknown) => void) {
  const program = new Command()
  const helloWorld = getHelloWorld(output)

  program
    .option('-a, --api-url <url>', 'API URL', process.env.ITB_API_URL || 'http://localhost:3000')
    .option('--auth-url <url>', 'Auth URL', process.env.ITB_AUTH_URL || 'http://127.0.0.1:4444')

  program
    .command('hello-world <name>')
    .action(name => helloWorld(name))

  program
    .command('login')
    .action(async () => {
      const { authUrl } = program.opts()
      const config: client.Configuration = await client.discovery(new URL(authUrl), 'f3dd9810-a420-4359-b749-a4571c3d40ac', { client_secret: 'GoCpTnXfZHLrQnIPb8oRqORrEn' }, undefined, { execute: [client.allowInsecureRequests] })

      const code_verifier = client.randomPKCECodeVerifier()
      const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)

      const server = http.createServer(async (req, res) => {
        if (!req.url) {
          res.end('Invalid request')
          return
        }
        try {
          const tokens = await client.authorizationCodeGrant(
            config,
            new URL(req.url, 'http://localhost:4567'),
            {
              pkceCodeVerifier: code_verifier,
              expectedState: 'BananaMana'
            }
          )
          console.log(tokens)
          if (tokens.access_token) {
            await writeFile(join(homedir(), '.itb-api-jwt'), tokens.access_token, 'utf-8')
          }
          res.end('Logged in successfully! You can close this window.')
        } catch (err) {
          console.error(err)
          res.end('Login failed. Please check the console.')
        } finally {
          server.close()
          process.exit(0)
        }
      })

      server.listen(4567, () => {
        const redirectTo = client.buildAuthorizationUrl(config, {
          scope: 'openid offline',
          code_challenge,
          code_challenge_method: 'S256',
          redirect_uri: 'http://localhost:4567/callback',
          state: 'BananaMana'
        })
        console.log('Opening browser to:', redirectTo.href)
        open(redirectTo.href)
      })
    })

  registerCurrencies(program, getJwt, output)
  registerAccounts(program, getJwt, output)
  registerAccountTypes(program, getJwt, output)

  return program
}

export { getProgram }
