<script setup lang="ts">
import type { ImageAsset } from '../../../types/wedding'
defineProps<{ image: ImageAsset }>()
</script>

<template>
  <div
    class="photo-divider"
    :class="{
      'photo-divider--framed': image.presentation === 'framed',
      'photo-divider--cinematic': image.tone === 'cinematic',
    }"
    :style="{
      '--photo-position-mobile': image.mobilePosition ?? image.position ?? 'center',
      '--photo-position-desktop': image.desktopPosition ?? image.position ?? 'center',
    }"
  >
    <picture v-if="image.presentation === 'framed'" class="photo-divider__backdrop" aria-hidden="true">
      <source v-if="image.desktopSrc" media="(min-width: 900px)" :srcset="image.desktopSrc" />
      <img :src="image.src" alt="" loading="lazy" decoding="async" />
    </picture>
    <picture class="photo-divider__media">
      <source v-if="image.desktopSrc" media="(min-width: 900px)" :srcset="image.desktopSrc" />
      <img
        :src="image.src"
        :alt="image.alt"
        :width="image.width"
        :height="image.height"
        loading="lazy"
        decoding="async"
      />
    </picture>
    <div class="photo-divider__shade" aria-hidden="true"></div>
    <span v-if="image.placeholder" class="photo-divider__placeholder-note">Illustrative photography</span>
  </div>
</template>
