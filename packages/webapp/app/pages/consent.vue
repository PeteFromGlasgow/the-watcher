<template>
  <div class="flex justify-center items-center h-screen">
    <Card v-if="consentRequest" class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authorize Application</CardTitle>
        <CardDescription>
          The application <strong>{{ consentRequest.client?.client_name || 'Unknown' }}</strong> wants to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm font-medium">The application requests the following permissions:</p>
        <ul class="list-disc list-inside mt-2 space-y-1">
          <li v-for="scope in consentRequest.requested_scope" :key="scope">{{ scope }}</li>
        </ul>
      </CardContent>
      <CardFooter class="flex justify-end space-x-2">
        <Button variant="outline" @click="rejectConsent">Deny</Button>
        <Button @click="acceptConsent">Allow</Button>
      </CardFooter>
    </Card>
    <div v-else-if="error">
      <p>An error occurred:</p>
      <pre>{{ error.message }}</pre>
    </div>
    <div v-else>
      <p>Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { OAuth2ConsentRequest, AcceptOAuth2ConsentRequest, OAuth2RedirectTo } from '@ory/hydra-client'
import { Configuration, FrontendApi } from '@ory/kratos-client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()
const consentRequest = ref<OAuth2ConsentRequest | null>(null)
const error = ref<any | null>(null)

const kratos = new FrontendApi(
  new Configuration({
    basePath: useRuntimeConfig().public.kratosPublicUrl as string || 'http://localhost:4433',
    baseOptions: {
      withCredentials: true,
    }
  }),
)

onMounted(async () => {
  const challenge = route.query.consent_challenge as string

  if (!challenge) {
    error.value = new Error('Consent challenge is missing')
    return
  }

  try {
    await kratos.toSession()
  } catch (error) {
    const params = new URLSearchParams()
    params.set('login_challenge', challenge)
    router.push(`/login?${params.toString()}`)
    return
  }

  try {
    const { data } = await useFetch<OAuth2ConsentRequest>(`/api/oauth2/consent?consent_challenge=${challenge}`)
    if (data.value) {
      consentRequest.value = data.value
    }
  } catch (e) {
    error.value = e
  }
})

async function acceptConsent() {
  if (!consentRequest.value) return

  try {
    const acceptRequest: AcceptOAuth2ConsentRequest = {
      grant_scope: consentRequest.value.requested_scope,
      remember: true,
      remember_for: 3600
    }

    const { data } = await useFetch<OAuth2RedirectTo>(`/api/oauth2/consent?consent_challenge=${consentRequest.value.challenge}`, {
      method: 'POST',
      body: acceptRequest
    })

    if (data.value) {
      window.location.href = data.value.redirect_to
    }
  } catch (e) {
    error.value = e
  }
}

async function rejectConsent() {
  if (!consentRequest.value) return

  try {
    const { data } = await useFetch<OAuth2RedirectTo>(`/api/oauth2/consent?consent_challenge=${consentRequest.value.challenge}`, {
      method: 'PUT',
      body: {
        error: 'access_denied',
        error_description: 'The resource owner or authorization server denied the request'
      }
    })
    if (data.value) {
      window.location.href = data.value.redirect_to
    }
  } catch (e) {
    error.value = e
  }
}
</script>
