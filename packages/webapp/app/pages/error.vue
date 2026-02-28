<template>
  <div class="flex justify-center items-center h-screen">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Error</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="error">
          <pre>{{ JSON.stringify(error, null, 2) }}</pre>
        </div>
        <div v-else>
          <p>An unknown error occurred.</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from '#imports'
import { Configuration, FrontendApi, type FlowError } from '@ory/kratos-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const route = useRoute()
const error = ref<FlowError | null>(null)

const kratos = new FrontendApi(
  new Configuration({
    basePath: useRuntimeConfig().public.kratosPublicUrl as string || 'http://127.0.0.1:4433',
  }),
)

onMounted(async () => {
  const errorId = route.query.id as string
  if (errorId) {
    try {
      const { data } = await kratos.getFlowError({ id: errorId })
      error.value = data
    } catch (err) {
      console.error(err)
    }
  }
})
</script>
