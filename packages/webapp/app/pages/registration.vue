<template>
  <div class="flex justify-center items-center min-h-screen">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create a new account to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="submitForm" class="flex flex-col gap-4 w-full">
          <div v-for="message in flow?.ui.messages" :key="message.id">
            <Alert :variant="message.type === 'error' ? 'destructive' : 'default'">
              {{ message.text }}
            </Alert>
          </div>
          <div v-if="passwordMismatchError">
            <Alert variant="destructive">
              Passwords do not match.
            </Alert>
          </div>
          <template v-for="node in flow?.ui.nodes">
            <div :key="node.attributes.name" v-if="node.attributes.type !== 'hidden' || (node.messages && node.messages.length > 0)" class="flex flex-col gap-2">
              <div v-for="message in node.messages" :key="message.id">
                <Alert variant="destructive">
                  {{ message.text }}
                </Alert>
              </div>
              <template v-if="node.attributes.type !== 'hidden' && node.attributes.type !== 'submit'">
                <div>
                  <label :for="node.attributes.name" class="block font-semibold mb-2">{{ node.meta.label?.text }}</label>
                  <Input
                    v-if="node.attributes.type === 'text' || node.attributes.type === 'email'"
                    :id="node.attributes.name"
                    :name="node.attributes.name"
                    :type="node.attributes.type"
                    v-model="formData[node.attributes.name]"
                    class="w-full"
                  />
                </div>
              </template>
            </div>
          </template>
          <div class="flex flex-col gap-2">
            <label for="password" class="block font-semibold mb-2">Password</label>
            <Input
              id="password"
              name="password"
              type="password"
              v-model="password"
              class="w-full"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="password_confirm" class="block font-semibold mb-2">Confirm Password</label>
            <Input
              id="password_confirm"
              name="password_confirm"
              type="password"
              v-model="passwordConfirm"
            />
          </div>
          <Button type="submit" class="w-full">
            Register
          </Button>
        </form>
      </CardContent>
      <CardFooter class="flex justify-center">
        <p class="text-sm text-muted-foreground">
          Already have an account?
          <NuxtLink to="/login" class="text-primary underline-offset-4 hover:underline">
            Login
          </NuxtLink>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import { Configuration, FrontendApi, type RegistrationFlow, type UpdateRegistrationFlowWithPasswordMethod, type UiNode } from '@ory/kratos-client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'


const route = useRoute()
const router = useRouter()

const flow = ref<RegistrationFlow | null>(null)
const formData = ref<Record<string, any>>({})
const password = ref('')
const passwordConfirm = ref('')
const passwordMismatchError = ref(false)

const kratos = new FrontendApi(
  new Configuration({
    basePath: useRuntimeConfig().public.kratosPublicUrl as string || 'http://localhost:4433',
    baseOptions: {
      withCredentials: true
    }
  })
)

onMounted(async () => {
  const flowId = route.query.flow as string
  if (flowId) {
    try {
      const { data } = await kratos.getRegistrationFlow({ id: flowId })
      flow.value = data
      initializeFormData(data.ui.nodes)
    } catch (error) {
      console.error(error)
    }
  } else {
    try {
      const { data } = await kratos.createBrowserRegistrationFlow()
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
  passwordMismatchError.value = false
  if (password.value !== passwordConfirm.value) {
    passwordMismatchError.value = true
    return
  }

  if (!flow.value) return

  const body: UpdateRegistrationFlowWithPasswordMethod = {
    method: 'password',
    password: password.value,
    traits: {
      email: formData.value['traits.email'],
      displayName: formData.value['traits.displayName']
    },
    csrf_token: formData.value.csrf_token
  }

  try {
    await kratos.updateRegistrationFlow({
      flow: flow.value.id,
      updateRegistrationFlowBody: body
    })
    await useAuth().fetchSession()
    router.push('/')
  } catch (error: any) {
    if (error.response?.data) {
      flow.value = error.response.data
      initializeFormData(error.response.data.ui.nodes)
    }
    console.error(error)
  }
}
</script>
