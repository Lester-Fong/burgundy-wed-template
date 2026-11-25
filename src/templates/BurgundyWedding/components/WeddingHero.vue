<script setup lang="ts">
import type { ImageAsset, WeddingContent } from '../../../types/wedding'

defineProps<{
  couple: WeddingContent['couple']
  date: WeddingContent['date']
  image: ImageAsset
}>()
</script>

<template>
  <section class="hero" :class="{ 'hero--daylight': image.tone === 'daylight' }" aria-labelledby="hero-title">
    <picture
      class="hero__backdrop"
      aria-hidden="true"
      :style="{ '--hero-position-desktop': image.desktopPosition ?? image.position ?? 'center' }"
    >
      <source v-if="image.desktopSrc" media="(min-width: 900px)" :srcset="image.desktopSrc" />
      <img :src="image.src" alt="" decoding="async" />
    </picture>
    <picture
      class="hero__media"
      :class="{ 'hero__media--framed': image.desktopFrameRatio && image.desktopFrameRatio > 0 }"
      :style="{ '--hero-desktop-frame-ratio': image.desktopFrameRatio }"
    >
      <source v-if="image.desktopSrc" media="(min-width: 900px)" :srcset="image.desktopSrc" />
      <img
        class="hero__image"
        :src="image.src"
        :alt="image.alt"
        :width="image.width"
        :height="image.height"
        :style="{
          '--hero-position-mobile': image.mobilePosition ?? image.position ?? 'center',
          '--hero-position-desktop': image.desktopPosition ?? image.position ?? 'center',
        }"
        fetchpriority="high"
      />
    </picture>
    <div class="hero__shade" aria-hidden="true"></div>
    <span v-if="image.placeholder" class="hero__placeholder-note">Illustrative photography</span>
    <div class="hero__content">
      <div class="hero__monogram" aria-hidden="true">{{ couple.monogram }}</div>
      <h2 id="hero-title" class="hero__names">
        <span>{{ couple.first }}</span>
        <em>&</em>
        <span>{{ couple.second }}</span>
      </h2>
      <time class="hero__date" :datetime="date.iso">{{ date.display }}</time>
    </div>
  </section>
</template>
