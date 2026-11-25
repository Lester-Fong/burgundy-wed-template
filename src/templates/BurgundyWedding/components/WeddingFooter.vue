<script setup lang="ts">
import { computed } from 'vue'
import type { FooterContent, WeddingContent } from '../../../types/wedding'
import { safeExternalUrl } from '../../../utils/links'

const props = defineProps<{ couple: WeddingContent['couple']; content?: FooterContent }>()
const brandHref = computed(() => safeExternalUrl(props.content?.brandUrl))
</script>

<template>
  <footer class="footer">
    <div class="footer__monogram">{{ couple.monogram }}</div>
    <p class="footer__message">With love, {{ couple.first }} &amp; {{ couple.second }}</p>
    <span class="footer__divider" aria-hidden="true"></span>
    <small v-if="content" class="footer__credit">
      {{ content.attribution }}
      <a v-if="brandHref" class="footer__brand" :href="brandHref" target="_blank" rel="noopener noreferrer">{{
        content.brand
      }}</a>
      <span v-else class="footer__brand">{{ content.brand }}</span>
    </small>
  </footer>
</template>
