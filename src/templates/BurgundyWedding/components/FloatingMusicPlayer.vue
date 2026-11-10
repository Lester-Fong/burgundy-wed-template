<script setup lang="ts">
import { ref } from 'vue'
import type { WeddingContent } from '../../../types/wedding'
defineProps<{ music: NonNullable<WeddingContent['music']>; visible: boolean }>()
const audio = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const error = ref(false)

async function play() {
  if (!audio.value) return
  try {
    await audio.value.play()
    playing.value = true
    error.value = false
  } catch {
    playing.value = false
    error.value = true
  }
}

function toggle() {
  if (playing.value) {
    audio.value?.pause()
    playing.value = false
  } else void play()
}

function handleError() {
  error.value = true
  playing.value = false
}

defineExpose({ play, toggle, playing, error })
</script>

<template>
  <div
    class="music-control"
    :class="{ 'music-control--visible': visible }"
    :inert="!visible"
    :aria-hidden="!visible"
  >
    <audio
      ref="audio"
      :src="music.src"
      loop
      preload="none"
      @play="playing = true"
      @pause="playing = false"
      @ended="playing = false"
      @error="handleError"
    ></audio>
    <button
      type="button"
      :aria-label="playing ? 'Pause background music' : 'Play background music'"
      :aria-pressed="playing"
      :title="error ? 'Music unavailable' : music.title"
      @click="toggle"
    >
      <span aria-hidden="true">{{ playing ? 'Ⅱ' : '♪' }}</span>
    </button>
    <span class="music-control__label">{{
      error ? 'Audio unavailable' : playing ? 'Music on' : 'Music off'
    }}</span>
  </div>
</template>
