<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { WeddingContent } from '../../../types/wedding'
defineProps<{ music: NonNullable<WeddingContent['music']>; visible: boolean }>()
const audio = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const loading = ref(false)
const error = ref(false)

onMounted(() => {
  // The player stays mounted behind the intro. Buffer the audio without playing it.
  if (audio.value?.networkState === HTMLMediaElement.NETWORK_EMPTY) audio.value.load()
})

async function play() {
  if (!audio.value) return
  loading.value = audio.value.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
  try {
    await audio.value.play()
    playing.value = true
    loading.value = false
    error.value = false
  } catch (reason) {
    playing.value = false
    loading.value = false
    if (!(reason instanceof DOMException && reason.name === 'AbortError')) error.value = true
  }
}

function toggle() {
  if (playing.value || (loading.value && audio.value && !audio.value.paused)) {
    audio.value?.pause()
    playing.value = false
    loading.value = false
  } else void play()
}

function handlePause() {
  playing.value = false
  loading.value = false
}

function handleWaiting() {
  if (!audio.value?.paused) loading.value = true
}

function handleError() {
  error.value = true
  playing.value = false
  loading.value = false
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
      preload="auto"
      @play="playing = true"
      @playing="loading = false"
      @waiting="handleWaiting"
      @pause="handlePause"
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
      error ? 'Audio unavailable' : loading ? 'Music loading' : playing ? 'Music on' : 'Music off'
    }}</span>
  </div>
</template>
