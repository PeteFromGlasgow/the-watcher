<template>
  <div class="flex justify-center items-center min-h-screen">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="submitForm" class="flex flex-col gap-4 w-full">
          <div v-for="message in flow?.ui.messages" :key="message.id">
            <Alert :variant="message.type === 'error' ? 'destructive' : 'default'">
              {{ message.text }}
            </Alert>
          </div>
          <div v-for="node in flow?.ui.nodes" :key="(node.attributes as any).name" class="flex flex-col gap-1">
            <template v-if="'name' in node.attributes && node.attributes.type !== 'hidden' && node.attributes.type !== 'submit'">
              <label :for="node.attributes.name">{{ node.meta.label?.text }}</label>
              <Input
                :id="node.attributes.name"
                :name="node.attributes.name"
                :type="node.attributes.type"
                v-model="formData[node.attributes.name]"
                :placeholder="node.meta.label?.text"
              />
              <div v-for="message in node.messages" :key="message.id">
                <Alert variant="destructive">
                  {{ message.text }}
                </Alert>
              </div>
            </template>
          </div>
          <Button type="submit" class="w-full">
            Login
          </Button>
        </form>
      </CardContent>
      <CardFooter class="flex justify-center">
        <p class="text-sm text-muted-foreground">
          Don't have an account?
          <NuxtLink to="/registration" class="text-primary underline-offset-4 hover:underline">
            Register
          </NuxtLink>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import { Configuration, FrontendApi, type LoginFlow, type UpdateLoginFlowWithPasswordMethod, type UiNode } from '@ory/kratos-client'
import { type OAuth2LoginRequest, type OAuth2RedirectTo } from '@ory/hydra-client'
import { useFetch } from '#imports'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()

const flow = ref<LoginFlow | null>(null)
const formData = ref<Record<string, any>>({})

const kratos = new FrontendApi(
  new Configuration({
    basePath: useRuntimeConfig().public.kratosPublicUrl as string,
    baseOptions: {
      withCredentials: true
    }
  })
)

onMounted(async () => {
  const flowId = route.query.flow as string
  const loginChallenge = route.query.login_challenge as string

  try {
    const { data: session } = await kratos.toSession()
    if (session && loginChallenge) {
      const { data: acceptResponse } = await useFetch<OAuth2RedirectTo>(`/api/oauth2/login?login_challenge=${loginChallenge}`, {
        method: 'PUT',
        body: {
          subject: session.identity!.id
        }
      })
      if (acceptResponse.value) {
        window.location.href = acceptResponse.value.redirect_to
      }
      return
    }
  } catch (error) {
    console.log('No session found')
  }

  if (loginChallenge) {
    try {
      const { data: hydraData } = await useFetch<OAuth2LoginRequest>(`/api/oauth2/login?login_challenge=${loginChallenge}`)
      if (hydraData.value && hydraData.value.skip) {
        const { data: acceptResponse } = await useFetch<OAuth2RedirectTo>(`/api/oauth2/login?login_challenge=${loginChallenge}`, {
          method: 'PUT',
          body: {
            subject: hydraData.value.subject
          }
        })
        if (acceptResponse.value) {
          window.location.href = acceptResponse.value.redirect_to
        }
        return
      }
    } catch (error) {
      console.error(error)
    }
  }

  if (flowId) {
    try {
      const { data } = await kratos.getLoginFlow({ id: flowId }, { withCredentials: true })
      flow.value = data
      initializeFormData(data.ui.nodes)
    } catch (error) {
      console.error(error)
    }
  } else {
    try {
      const { data } = await kratos.createBrowserLoginFlow(undefined, { withCredentials: true })
      flow.value = data
      initializeFormData(data.ui.nodes)
    } catch (error) {
      console.error(error)
    }
  }
})

function initializeFormData(nodes: Array<UiNode>) {
  formData.value = nodes.reduce((acc, node) => {
    if ('name' in node.attributes) {
      acc[node.attributes.name] = node.attributes.value || ''
    }
    return acc
  }, {} as Record<string, any>)
}

async function submitForm() {
  if (!flow.value) return

  const body: UpdateLoginFlowWithPasswordMethod = {
    method: 'password',
    csrf_token: formData.value.csrf_token,
    identifier: formData.value.identifier,
    password: formData.value.password
  }

  try {
    const { data } = await kratos.updateLoginFlow({
      flow: flow.value.id,
      updateLoginFlowBody: body as any
    })

    const loginChallenge = route.query.login_challenge as string
    if (loginChallenge && data.session?.identity?.id) {
      const { data: acceptResponse } = await useFetch<OAuth2RedirectTo>(`/api/oauth2/login?login_challenge=${loginChallenge}`, {
        method: 'PUT',
        body: {
          subject: data.session.identity.id
        }
      })
      if (acceptResponse.value) {
        window.location.href = acceptResponse.value.redirect_to
      }
    } else {
      await useAuth().fetchSession()
      router.push('/')
    }
  } catch (error: any) {
    if (error.response?.data) {
      flow.value = error.response.data
      initializeFormData(error.response.data.ui.nodes)
    }
    console.error(error)
  }
}
</script>
