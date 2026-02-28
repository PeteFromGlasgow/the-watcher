<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { navigationMenuTriggerStyle } from '@/components/ui/navigation-menu'

defineProps<{
  session: import('@ory/kratos-client').Session | null
  isLoading: boolean
}>()

const emit = defineEmits(['logout'])
</script>

<template>
  <NavigationMenu>
    <NavigationMenuList v-if="!isLoading">
      <NavigationMenuItem v-if="!session">
        <NuxtLink to="/login" :class="navigationMenuTriggerStyle()">
          Login
        </NuxtLink>
      </NavigationMenuItem>
      <NavigationMenuItem v-if="!session">
        <NuxtLink to="/registration" :class="navigationMenuTriggerStyle()">
          Registration
        </NuxtLink>
      </NavigationMenuItem>
      <NavigationMenuItem v-if="session">
        <NuxtLink to="/settings" :class="navigationMenuTriggerStyle()">
          Settings
        </NuxtLink>
      </NavigationMenuItem>
      <NavigationMenuItem v-if="session">
        <NavigationMenuLink href="#" :class="navigationMenuTriggerStyle()" @click.prevent="emit('logout')">
          Logout
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
