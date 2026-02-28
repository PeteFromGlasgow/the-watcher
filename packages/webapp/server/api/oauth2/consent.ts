import { defineEventHandler, getQuery, readBody } from 'h3'
import hydra from '@/lib/hydra'

export default defineEventHandler(async (event) => {
  const { consent_challenge } = getQuery(event)

  if (typeof consent_challenge !== 'string') {
    return {
      statusCode: 400,
      body: {
        error: 'Bad Request',
        error_description: 'consent_challenge is required'
      }
    }
  }

  if (event.node.req.method === 'GET') {
    const { data } = await hydra.getOAuth2ConsentRequest({ consentChallenge: consent_challenge })
    return data
  }

  if (event.node.req.method === 'POST') {
    const body = await readBody(event)
    const { data } = await hydra.acceptOAuth2ConsentRequest({
      consentChallenge: consent_challenge,
      acceptOAuth2ConsentRequest: body
    })
    return data
  }

  if (event.node.req.method === 'PUT') {
    const body = await readBody(event)
    const { data } = await hydra.rejectOAuth2ConsentRequest({
      consentChallenge: consent_challenge,
      rejectOAuth2Request: body
    })
    return data
  }
})
