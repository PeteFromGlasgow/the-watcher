<script setup lang="ts">
import { DropdownMenuTrigger, type DropdownMenuTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<DropdownMenuTriggerProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <DropdownMenuTrigger v-bind="props" :class="cn(props.class)">
    <slot />
  </DropdownMenuTrigger>
</template>
