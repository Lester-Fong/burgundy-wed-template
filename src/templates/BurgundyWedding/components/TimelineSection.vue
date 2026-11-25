<script setup lang="ts">
import { computed } from 'vue'
import type { ImageAsset, TimelineContent } from '../../../types/wedding'
import TimelineIcon from './TimelineIcon.vue'

const props = defineProps<{ content: TimelineContent; image: ImageAsset }>()
const imagePosition = computed(() => ({
  '--timeline-image-mobile': props.image.mobilePosition ?? props.image.position ?? 'center',
  '--timeline-image-desktop': props.image.desktopPosition ?? props.image.position ?? 'center',
  '--timeline-image-desktop-scale': props.image.desktopScale ?? 1,
  '--timeline-image-desktop-origin': props.image.desktopTransformOrigin ?? 'center',
}))
</script>

<template>
  <section
    class="section timeline"
    :class="{ 'timeline--portrait-photo': image.presentation === 'timeline-portrait' }"
    aria-labelledby="timeline-title"
    :style="imagePosition"
  >
    <picture class="timeline__media">
      <source v-if="image.desktopSrc" media="(min-width: 900px)" :srcset="image.desktopSrc" />
      <img class="timeline__image" :src="image.src" alt="" loading="lazy" decoding="async" />
    </picture>
    <div class="timeline__veil" aria-hidden="true"></div>
    <div class="timeline__inner">
      <header class="timeline__header" data-timeline-reveal>
        <h2 id="timeline-title">{{ content.heading }}</h2>
        <p v-if="content.provisional && content.note" class="timeline__note">{{ content.note }}</p>
      </header>
      <ol class="timeline__list" data-timeline-reveal>
        <li v-for="event in content.events" :key="event.id" class="timeline__event">
          <TimelineIcon :kind="event.icon" class="timeline__icon" />
          <span class="timeline__rail" aria-hidden="true"><span class="timeline__dot"></span></span>
          <div class="timeline__copy">
            <time>{{ event.time }}</time>
            <h3>{{ event.title }}</h3>
            <p v-if="event.detail">{{ event.detail }}</p>
          </div>
        </li>
      </ol>
    </div>
    <span v-if="image.placeholder" class="timeline__photo-note">Illustrative photography</span>
  </section>
</template>
