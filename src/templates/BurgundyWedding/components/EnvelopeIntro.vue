<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { WeddingContent } from '../../../types/wedding'
import { formatInvitationDate } from '../../../utils/dates'

const props = defineProps<{ couple: WeddingContent['couple']; date: WeddingContent['date'] }>()
const emit = defineEmits<{ open: [withMusic: boolean]; finish: [] }>()
const compactDate = computed(() => formatInvitationDate(props.date.iso))
const typedDate = ref('')
const opening = ref(false)
const revealed = ref(false)
let typingFrame: number | undefined
let finishTimer: number | undefined
let revealFallback: number | undefined
let motionPreference: MediaQueryList | undefined

function showCompleteIntro() {
  if (typingFrame !== undefined) window.cancelAnimationFrame(typingFrame)
  typedDate.value = compactDate.value
  revealed.value = true
}

function handleMotionChange(event: MediaQueryListEvent) {
  if (event.matches) showCompleteIntro()
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', handleMotionChange)
  if (motionPreference.matches) {
    showCompleteIntro()
    return
  }

  const characterEnds = [...compactDate.value.matchAll(/[0-9·]/g)].map((match) => match.index + 1)
  const startedAt = performance.now()
  function typeDate(now: number) {
    const count = Math.min(
      characterEnds.length,
      Math.floor(((now - startedAt) / 1750) * characterEnds.length),
    )
    typedDate.value = count ? compactDate.value.slice(0, characterEnds[count - 1]) : ''
    if (count < characterEnds.length) typingFrame = window.requestAnimationFrame(typeDate)
  }
  typingFrame = window.requestAnimationFrame(typeDate)
  revealFallback = window.setTimeout(showCompleteIntro, 3400)
})

onBeforeUnmount(() => {
  if (typingFrame !== undefined) window.cancelAnimationFrame(typingFrame)
  if (finishTimer !== undefined) window.clearTimeout(finishTimer)
  if (revealFallback !== undefined) window.clearTimeout(revealFallback)
  motionPreference?.removeEventListener('change', handleMotionChange)
})

function begin() {
  if (opening.value) return
  opening.value = true
  showCompleteIntro()
  emit('open', true)
  finishTimer = window.setTimeout(() => emit('finish'), motionPreference?.matches ? 50 : 780)
}
</script>

<template>
  <div
    class="intro"
    :class="{ 'intro--opening': opening, 'intro--revealed': revealed }"
    role="dialog"
    aria-modal="true"
    aria-label="Open wedding invitation"
  >
    <div class="intro__inner">
      <div class="intro__masthead">
        <h1 class="intro__names">
          <span>{{ couple.first }}</span>
          <span class="intro__amp">&</span>
          <span>{{ couple.second }}</span>
        </h1>
        <time class="intro__date" :datetime="date.iso" :data-full-date="compactDate">
          <span class="intro__sr-only">{{ date.display }}</span>
          <span class="intro__date-visible" aria-hidden="true">{{ typedDate }}</span>
        </time>
      </div>

      <button
        class="intro__open"
        type="button"
        :aria-disabled="opening"
        aria-label="Open wedding invitation and play music"
        @click="begin"
      >
        <span class="intro__stage" aria-hidden="true">
          <span class="intro__cartouche"></span>
          <img
            class="intro__florals intro__florals--left"
            src="/images/template/intro-florals.webp"
            alt=""
            width="960"
            height="640"
            fetchpriority="high"
          />
          <img
            class="intro__florals intro__florals--right"
            src="/images/template/intro-florals.webp"
            alt=""
            width="960"
            height="640"
          />
          <span class="envelope">
            <span class="envelope__back"></span>
            <span class="envelope__letter"
              ><span>TOGETHER<br />FOREVER</span></span
            >
            <span class="envelope__flap"></span>
            <span class="envelope__front"></span>
            <span class="envelope__seal">{{ couple.monogram }}</span>
          </span>
        </span>
        <span class="intro__prompt">Tap to open</span>
      </button>
    </div>
  </div>
</template>
