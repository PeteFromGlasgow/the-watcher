<template>
  <div v-if="isLoading" class="flex justify-center items-center h-screen">
    <p class="text-muted-foreground">Loading...</p>
  </div>
  <div v-else-if="session" class="flex h-screen">
    <AppSidebar :session="session" @logout="logout" />
    <main class="flex-1 overflow-auto">
      <NuxtPage />
    </main>
  </div>
  <div v-else>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'

const { session, isLoading, logout } = useAuth()
</script>
