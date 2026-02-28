import { Configuration, OAuth2Api } from '@ory/hydra-client'
// import { useRuntimeConfig } from '#imports'

const hydra = new OAuth2Api(
  new Configuration({
    basePath: 'http://hydra:4445'
  })
)

export default hydra
