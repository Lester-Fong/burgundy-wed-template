<script setup lang="ts">
import type { WelcomeContent } from '../../../types/wedding'
import Ornament from './Ornament.vue'

defineProps<{
  content: WelcomeContent
  hasMusic: boolean
  playing: boolean
  error: boolean
}>()

defineEmits<{ toggleMusic: [] }>()
</script>

<template>
  <section class="welcome" aria-labelledby="welcome-title">
    <div class="welcome__inner">
      <h2 id="welcome-title" class="welcome__heading" data-welcome-reveal="0">
        {{ content.heading }}
      </h2>
      <div class="welcome__ornament" data-welcome-reveal="1">
        <Ornament />
      </div>
      <div v-if="hasMusic" class="welcome__music" data-welcome-reveal="2">
        <p class="welcome__music-label">{{ content.musicLabel }}</p>
        <div class="welcome__music-row">
          <span class="welcome__music-rule" aria-hidden="true"></span>
          <button
            class="welcome__music-button"
            type="button"
            :aria-label="playing ? 'Pause our song' : 'Play our song'"
            :aria-pressed="playing"
            @click="$emit('toggleMusic')"
          >
            <svg v-if="playing" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m9 5 10 7-10 7V5Z" fill="currentColor" />
            </svg>
          </button>
          <span class="welcome__music-rule" aria-hidden="true"></span>
        </div>
        <p v-if="error" class="welcome__music-error" role="status">Music is unavailable right now.</p>
      </div>
      <div class="welcome__message">
        <p
          v-for="(paragraph, index) in content.paragraphs"
          :key="index"
          :data-welcome-reveal="hasMusic ? index + 3 : index + 2"
        >
          {{ paragraph }}
        </p>
      </div>
    </div>
  </section>
</template>
