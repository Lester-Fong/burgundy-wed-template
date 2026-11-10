<script setup lang="ts">
import type { TimelineIconName } from '../../../types/wedding'

defineProps<{ kind: TimelineIconName }>()
</script>

<template>
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="kind === 'bells'">
      <path d="M8 31c5-3 7-8 7-15 0-5 3-8 7-8s7 3 7 8c0 7 2 12 7 15H8Z" />
      <path d="M13 31c1 5 5 8 9 8s8-3 9-8M20 8c0-2 1-3 2-3s2 1 2 3M17 39l-2 3m14-3 2 3" />
      <path d="M30 12c4 2 6 6 6 11m-26 0c0-5 2-9 6-11" />
    </template>
    <template v-else-if="kind === 'rings'">
      <circle cx="18" cy="27" r="9" />
      <circle cx="30" cy="27" r="9" />
      <path d="m17 18 3-5h8l3 5M20 13l4-6 4 6m-8 0 4 5 4-5M24 7v-3m-11 7-2-2m24 2 2-2" />
    </template>
    <template v-else-if="kind === 'glasses'">
      <path d="M6 8h15l-2 11c-1 4-3 6-6 6s-5-2-6-6L6 8Zm21 0h15l-1 11c-1 4-3 6-6 6s-5-2-6-6L27 8Z" />
      <path d="M13 25v13m22-13v13M7 39h12m10 0h12M13 38v-2m22 2v-2M8 15h11m10 0h11" />
    </template>
    <template v-else-if="kind === 'sparkle'">
      <path d="M24 3c1 10 4 13 13 14-9 1-12 4-13 14-1-10-4-13-13-14 9-1 12-4 13-14Z" />
      <path
        d="M37 28c.5 5 2 6.5 7 7-5 .5-6.5 2-7 7-.5-5-2-6.5-7-7ZM8 30l1.2 3.8L13 35l-3.8 1.2L8 40l-1.2-3.8L3 35l3.8-1.2L8 30Z"
      />
    </template>
    <template v-else-if="kind === 'dinner'">
      <circle cx="25" cy="24" r="13" />
      <circle cx="25" cy="24" r="9" />
      <path d="M5 7v15m4-15v15m4-15v15M5 17h8M9 22v20M43 7c-5 4-6 10-6 16h6V7Zm0 16v19" />
    </template>
    <template v-else>
      <circle cx="24" cy="24" r="15" />
      <path
        d="M24 9v30M9 24h30M13 14c7 4 15 4 22 0M13 34c7-4 15-4 22 0M16 12c4 8 4 16 0 24m16-24c-4 8-4 16 0 24M24 4V2m0 44v-2M4 24H2m44 0h-2"
      />
    </template>
  </svg>
</template>
