<template>
  <div class="flex justify-center items-center h-screen">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Recovery</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="submitForm">
          <div v-for="field in flow?.ui.nodes" :key="field.attributes.name" class="mb-4">
            <label :for="field.attributes.name" class="block text-sm font-medium text-gray-700">
              {{ field.meta.label?.text }}
            </label>
            <Input
              :id="field.attributes.name"
              :name="field.attributes.name"
              :type="field.attributes.type"
              v-model="formData[field.attributes.name]"
              class="mt-1 block w-full"
              :required="field.attributes.required"
            />
          </div>
          <Button type="submit" class="w-full">
            Recover
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import { Configuration, FrontendApi, type RecoveryFlow, type UiNode } from '@ory/kratos-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()

const flow = ref<RecoveryFlow | null>(null)
const formData = ref<Record<string, any>>({})

const kratos = new FrontendApi(
  new Configuration({
    basePath: useRuntimeConfig().public.kratosPublicUrl || 'http://127.0.0.1:4433',
  }),
)

onMounted(async () => {
  const flowId = route.query.flow as string
  if (flowId) {
    try {
      const { data } = await kratos.getRecoveryFlow({ id: flowId })
      flow.value = data
      initializeFormData(data.ui.nodes)
    } catch (error) {
      console.error(error)
    }
  } else {
    try {
      const { data } = await kratos.createBrowserRecoveryFlow()
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

  try {
    const { data } = await kratos.updateRecoveryFlow({
      flow: flow.value.id,
      updateRecoveryFlowBody: {
        method: 'link',
        ...formData.value,
      },
    })
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
