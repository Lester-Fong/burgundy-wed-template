<script setup lang="ts">
import type { WeddingContent } from '../../../types/wedding'
defineProps<{ couple: WeddingContent['couple']; text?: string; notice?: string }>()
</script>

<template>
  <footer class="footer">
    <div class="footer__monogram">{{ couple.monogram }}</div>
    <p>{{ text }}</p>
    <small>{{ notice }}</small>
  </footer>
</template>
