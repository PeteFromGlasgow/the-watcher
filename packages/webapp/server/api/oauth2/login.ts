import { defineEventHandler, getQuery, readBody } from 'h3'
import hydra from '../../../app/lib/hydra'

export default defineEventHandler(async (event) => {
  const { login_challenge: loginChallenge } = getQuery(event)

  if (typeof loginChallenge !== 'string') {
    return {
      error: 'login_challenge is required'
    }
  }

  if (event.node.req.method === 'GET') {
    const { data: hydraData } = await hydra.getOAuth2LoginRequest({ loginChallenge })
    return hydraData
  }

  if (event.node.req.method === 'PUT') {
    const { subject } = await readBody(event)
    const { data: acceptResponse } = await hydra.acceptOAuth2LoginRequest({
      loginChallenge,
      acceptOAuth2LoginRequest: {
        subject
      }
    })
    return acceptResponse
  }
})
