<script setup lang="ts">
import { ref } from 'vue'
import type { WeddingContent } from '../../../types/wedding'
import Ornament from './Ornament.vue'

defineProps<{ couple: WeddingContent['couple']; date: WeddingContent['date'] }>()
const emit = defineEmits<{ open: [withMusic: boolean]; finish: [] }>()
const opening = ref(false)

function begin(withMusic: boolean) {
  if (opening.value) return
  opening.value = true
  emit('open', withMusic)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.setTimeout(() => emit('finish'), reduced ? 50 : 780)
}
</script>

<template>
  <div
    class="intro"
    :class="{ 'intro--opening': opening }"
    role="dialog"
    aria-modal="true"
    aria-label="Open wedding invitation"
  >
    <div class="intro__grain" aria-hidden="true"></div>
    <div class="intro__inner">
      <div class="intro__masthead">
        <p class="eyebrow intro__eyebrow">The wedding invitation</p>
        <h1 class="intro__names">
          <span class="intro__name">{{ couple.first }}</span>
          <span class="intro__amp">&</span>
          <span class="intro__name">{{ couple.second }}</span>
        </h1>
        <p class="intro__date">{{ date.display }}</p>
        <Ornament />
      </div>
      <div class="intro__stage">
        <svg class="intro__botanical" viewBox="0 0 500 300" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
            <path
              d="M32 273C68 222 66 158 111 112c18-18 39-30 68-42M48 252c17-24 41-31 62-36M72 196c-1-30 12-55 30-73M107 137c9-29 28-48 50-63"
            />
            <path
              d="M468 273c-36-51-34-115-79-161-18-18-39-30-68-42m131 182c-17-24-41-31-62-36m38-20c1-30-12-55-30-73m-5 14c-9-29-28-48-50-63"
            />
            <path
              d="M63 234c-18-4-31-19-32-34 17 1 29 10 32 34Zm21-59c-14-11-20-26-15-40 14 6 20 20 15 40Zm35-69c-13-15-14-31-6-43 13 10 16 25 6 43Zm18 109c6-20 20-32 37-34-3 18-16 30-37 34Z"
            />
            <path
              d="M437 234c18-4 31-19 32-34-17 1-29 10-32 34Zm-21-59c14-11 20-26 15-40-14 6-20 20-15 40Zm-35-69c13-15 14-31 6-43-13 10-16 25-6 43Zm-18 109c-6-20-20-32-37-34 3 18 16 30 37 34Z"
            />
          </g>
        </svg>
        <button
          class="intro__envelope-button"
          type="button"
          :disabled="opening"
          aria-label="Open the envelope with music"
          @click="begin(true)"
        >
          <span class="envelope" aria-hidden="true">
            <span class="envelope__back"></span>
            <span class="envelope__letter"
              ><span>TOGETHER<br />FOREVER</span></span
            >
            <span class="envelope__flap"></span>
            <span class="envelope__front"></span>
            <span class="envelope__seal">{{ couple.monogram }}</span>
          </span>
        </button>
      </div>
      <div class="intro__actions">
        <button
          class="button button--gold intro__button"
          type="button"
          :disabled="opening"
          @click="begin(true)"
        >
          <span>Open our invitation</span><span aria-hidden="true">↗</span>
        </button>
        <p class="intro__sound-note">A short instrumental preview will begin</p>
        <button class="intro__skip" type="button" :disabled="opening" @click="begin(false)">
          Enter without music
        </button>
      </div>
    </div>
    <span class="intro__corner intro__corner--tl" aria-hidden="true"></span>
    <span class="intro__corner intro__corner--tr" aria-hidden="true"></span>
    <span class="intro__corner intro__corner--bl" aria-hidden="true"></span>
    <span class="intro__corner intro__corner--br" aria-hidden="true"></span>
  </div>
</template>
