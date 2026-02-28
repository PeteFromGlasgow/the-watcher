<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Session } from '@ory/kratos-client'
import { PanelLeft, PanelLeftClose, Home, CircleUserRound, Settings, LogOut } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const props = defineProps<{
  session: Session | null
}>()

const emit = defineEmits(['logout'])

const collapsed = ref(false)

function toggleSidebar() {
  collapsed.value = !collapsed.value
}

const displayName = computed(() => {
  if (!props.session?.identity?.traits) return 'Account'
  return props.session.identity.traits.displayName || props.session.identity.traits.email || 'Account'
})
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <aside
      class="flex flex-col h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out"
      :class="collapsed ? 'w-16' : 'w-64'"
    >
      <!-- Header with toggle -->
      <div class="flex items-center p-3" :class="collapsed ? 'justify-center' : 'justify-between'">
        <span v-if="!collapsed" class="text-lg font-semibold truncate px-1">In The Black</span>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
              @click="toggleSidebar"
            >
              <PanelLeftClose v-if="!collapsed" class="h-4 w-4" />
              <PanelLeft v-else class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {{ collapsed ? 'Expand sidebar' : 'Collapse sidebar' }}
          </TooltipContent>
        </Tooltip>
      </div>

      <Separator class="bg-sidebar-border" />

      <!-- Navigation links -->
      <nav class="flex-1 p-2">
        <Tooltip>
          <TooltipTrigger as-child>
            <NuxtLink
              to="/"
              class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              :class="collapsed ? 'justify-center' : ''"
            >
              <Home class="h-4 w-4 shrink-0" />
              <span v-if="!collapsed">Home</span>
            </NuxtLink>
          </TooltipTrigger>
          <TooltipContent v-if="collapsed" side="right">
            Home
          </TooltipContent>
        </Tooltip>
      </nav>

      <Separator class="bg-sidebar-border" />

      <!-- Account section at bottom -->
      <div class="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            :class="collapsed ? 'justify-center' : ''"
          >
            <CircleUserRound class="h-5 w-5 shrink-0" />
            <span v-if="!collapsed" class="truncate">{{ displayName }}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" class="w-48 mb-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem as-child>
              <NuxtLink to="/settings" class="flex items-center gap-2 cursor-pointer">
                <Settings class="h-4 w-4" />
                Settings
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="flex items-center gap-2 cursor-pointer" @click="emit('logout')">
              <LogOut class="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  </TooltipProvider>
</template>
