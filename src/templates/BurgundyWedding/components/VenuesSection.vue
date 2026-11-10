<script setup lang="ts">
import type { WeddingContent } from '../../../types/wedding'
import VenueLocation from './VenueLocation.vue'

defineProps<{ content: NonNullable<WeddingContent['venues']> }>()
</script>

<template>
  <section class="section section--burgundy venues" aria-labelledby="venues-title">
    <div class="venues__inner">
      <h2 id="venues-title" data-venues-reveal>The Venues</h2>

      <div class="venues__grid" :class="{ 'venues__grid--single': content.items.length === 1 }">
        <article v-for="venue in content.items" :key="venue.kind" class="venue-panel" data-venues-reveal>
          <div v-if="venue.illustration" class="venue-panel__art">
            <img
              :src="venue.illustration.src"
              :alt="venue.illustration.alt"
              width="520"
              height="270"
              loading="lazy"
              decoding="async"
            />
          </div>

          <p class="venue-panel__role">{{ venue.kind }}</p>
          <h3 class="venue-panel__name">{{ venue.name }}</h3>
          <p class="venue-panel__address">{{ venue.address }}</p>
          <p v-if="venue.time" class="venue-panel__time">{{ venue.time }}</p>
          <p v-if="venue.parkingNote" class="venue-panel__parking">{{ venue.parkingNote }}</p>

          <VenueLocation :venue-name="venue.name" :verified-map-url="venue.verifiedMapUrl" />
        </article>
      </div>

      <p v-if="content.parkingNote" class="venues__parking" data-venues-reveal>
        {{ content.parkingNote }}
      </p>
    </div>
  </section>
</template>
