<script setup lang="ts">
import type { ImageAsset } from '../../../types/wedding'
defineProps<{ image: ImageAsset; variant?: 'portrait' }>()
</script>

<template>
  <div class="photo-divider" :class="{ 'photo-divider--portrait': variant === 'portrait' }">
    <img :src="image.src" :alt="image.alt" :style="{ objectPosition: image.position }" loading="lazy" />
    <div class="photo-divider__shade" aria-hidden="true"></div>
    <span v-if="image.placeholder" class="photo-divider__placeholder-note">Illustrative photography</span>
  </div>
</template>
