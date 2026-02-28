<template>
  <div class="mx-auto max-w-2xl space-y-8 px-4 py-12">
    <h1 class="text-3xl font-bold">Settings</h1>

    <Alert v-if="successMessage" variant="default" class="border-green-600/30 bg-green-600/10 text-green-400">
      <AlertDescription>{{ successMessage }}</AlertDescription>
    </Alert>

    <Alert v-if="globalError" variant="destructive">
      <AlertDescription>{{ globalError }}</AlertDescription>
    </Alert>

    <!-- Profile section -->
    <Card v-if="profileNodes.length">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="submitProfile" class="space-y-4">
          <input
            v-for="node in csrfNodes"
            :key="node.attributes.name"
            type="hidden"
            :name="node.attributes.name"
            :value="node.attributes.value"
          />
          <div v-for="node in profileNodes" :key="node.attributes.name" class="space-y-2">
            <label :for="node.attributes.name" class="text-sm font-medium">
              {{ node.meta.label?.text }}
            </label>
            <Input
              :id="node.attributes.name"
              v-model="formData[node.attributes.name]"
              :name="node.attributes.name"
              :type="node.attributes.type"
              :required="node.attributes.required"
              :disabled="node.attributes.disabled || submitting === 'profile'"
            />
            <p
              v-for="msg in node.messages"
              :key="msg.id"
              class="text-sm"
              :class="msg.type === 'error' ? 'text-destructive' : 'text-muted-foreground'"
            >
              {{ msg.text }}
            </p>
          </div>
          <Button type="submit" :disabled="submitting === 'profile'">
            {{ submitting === 'profile' ? 'Saving...' : 'Save profile' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- Password section -->
    <Card v-if="passwordNodes.length">
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change your account password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="submitPassword" class="space-y-4">
          <input
            v-for="node in csrfNodes"
            :key="node.attributes.name"
            type="hidden"
            :name="node.attributes.name"
            :value="node.attributes.value"
          />
          <div v-for="node in passwordNodes" :key="node.attributes.name" class="space-y-2">
            <label :for="node.attributes.name" class="text-sm font-medium">
              {{ node.meta.label?.text }}
            </label>
            <Input
              :id="node.attributes.name"
              v-model="formData[node.attributes.name]"
              :name="node.attributes.name"
              :type="node.attributes.type"
              :required="node.attributes.required"
              :disabled="node.attributes.disabled || submitting === 'password'"
            />
            <p
              v-for="msg in node.messages"
              :key="msg.id"
              class="text-sm"
              :class="msg.type === 'error' ? 'text-destructive' : 'text-muted-foreground'"
            >
              {{ msg.text }}
            </p>
          </div>
          <Button type="submit" :disabled="submitting === 'password'">
            {{ submitting === 'password' ? 'Updating...' : 'Update password' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from '#imports'
import {
  Configuration,
  FrontendApi,
  type SettingsFlow,
  type UiNode,
  type UiNodeInputAttributes
} from '@ory/kratos-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

const route = useRoute()

const flow = ref<SettingsFlow | null>(null)
const formData = ref<Record<string, string>>({})
const submitting = ref<'profile' | 'password' | null>(null)
const successMessage = ref('')
const globalError = ref('')

const kratos = new FrontendApi(
  new Configuration({
    basePath: useRuntimeConfig().public.kratosPublicUrl as string || 'http://localhost:4433'
  })
)

function isInputNode(node: UiNode): node is UiNode & { attributes: UiNodeInputAttributes } {
  return node.type === 'input'
}

const inputNodes = computed(() =>
  (flow.value?.ui.nodes ?? []).filter(isInputNode)
)

const csrfNodes = computed(() =>
  inputNodes.value.filter(n => n.attributes.name === 'csrf_token')
)

const profileNodes = computed(() =>
  inputNodes.value.filter(n =>
    (n.group === 'profile' || n.group === 'default')
    && n.attributes.type !== 'hidden'
    && n.attributes.type !== 'submit'
  )
)

const passwordNodes = computed(() =>
  inputNodes.value.filter(n =>
    n.group === 'password'
    && n.attributes.type !== 'hidden'
    && n.attributes.type !== 'submit'
  )
)

function initializeFormData(nodes: Array<UiNode>) {
  const data: Record<string, string> = {}
  for (const node of nodes) {
    if (isInputNode(node) && node.attributes.name) {
      data[node.attributes.name] = (node.attributes.value as string) ?? ''
    }
  }
  formData.value = data
}

async function fetchFlow() {
  const flowId = route.query.flow as string
  try {
    const { data } = flowId
      ? await kratos.getSettingsFlow({ id: flowId }, { withCredentials: true })
      : await kratos.createBrowserSettingsFlow({}, { withCredentials: true })
    flow.value = data
    initializeFormData(data.ui.nodes)
  } catch (err) {
    console.error(err)
    globalError.value = 'Could not load settings. Please try again.'
  }
}

function expandDotKeys(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {}
      }
      current = current[parts[i]] as Record<string, unknown>
    }
    current[parts[parts.length - 1]] = value
  }
  return result
}

async function submitSection(method: 'profile' | 'password') {
  if (!flow.value) return
  successMessage.value = ''
  globalError.value = ''
  submitting.value = method

  const flat: Record<string, string> = { method }

  // Always include csrf_token from the default group
  for (const node of inputNodes.value) {
    if (node.attributes.name === 'csrf_token') {
      flat.csrf_token = formData.value[node.attributes.name] ?? ''
      break
    }
  }

  // Include only fields belonging to this method's group
  for (const node of inputNodes.value) {
    if (node.group === method && node.attributes.type !== 'submit') {
      const val = formData.value[node.attributes.name]
      if (val !== undefined && val !== '') {
        flat[node.attributes.name] = val
      }
    }
  }

  // For profile, also include trait fields from the default group
  if (method === 'profile') {
    for (const node of inputNodes.value) {
      if (node.group === 'default' && node.attributes.name !== 'csrf_token') {
        const val = formData.value[node.attributes.name]
        if (val !== undefined && val !== '') {
          flat[node.attributes.name] = val
        }
      }
    }
  }

  const body = expandDotKeys(flat)

  try {
    const { data } = await kratos.updateSettingsFlow({
      flow: flow.value.id,
      updateSettingsFlowBody: body as any
    }, { withCredentials: true })

    flow.value = data
    initializeFormData(data.ui.nodes)
    successMessage.value = method === 'profile'
      ? 'Profile updated successfully.'
      : 'Password changed successfully.'
  } catch (error: any) {
    if (error.response?.data?.ui) {
      flow.value = error.response.data
      initializeFormData(error.response.data.ui.nodes)
    } else {
      globalError.value = 'Something went wrong. Please try again.'
    }
    console.error(error)
  } finally {
    submitting.value = null
  }
}

function submitProfile() {
  submitSection('profile')
}

function submitPassword() {
  submitSection('password')
}

onMounted(fetchFlow)
</script>
