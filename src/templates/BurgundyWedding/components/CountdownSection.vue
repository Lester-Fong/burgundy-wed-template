<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ClosingContent, WeddingContent } from '../../../types/wedding'
import { countdownTo } from '../../../utils/dates'

const props = defineProps<{ date: WeddingContent['date']; content: ClosingContent }>()
const now = ref(Date.now())
const targetIso = computed(
  () => props.date.countdownTarget?.iso ?? (props.date.timeConfirmed ? props.date.iso : undefined),
)
const remaining = computed(() => (targetIso.value ? countdownTo(targetIso.value, now.value) : null))
const completedMessage = computed(() => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: props.date.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(now.value))
  const value = (name: string) => parts.find((part) => part.type === name)?.value ?? ''
  const localDate = `${value('year')}-${value('month')}-${value('day')}`
  return localDate === props.date.iso
    ? 'Today is our wedding day.'
    : 'Thank you for celebrating our wedding day.'
})
const pad = (value: number) => String(value).padStart(2, '0')
let interval: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  interval = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <section class="section closing" aria-labelledby="closing-title">
    <img class="closing__background" :src="content.background.src" alt="" loading="lazy" decoding="async" />
    <div class="closing__inner">
      <div class="closing__opening" data-closing-reveal>
        <h2 id="closing-title">{{ content.heading }}</h2>
        <span class="closing__rule" aria-hidden="true"></span>
        <h3>{{ content.privacyHeading }}</h3>
        <p>{{ content.privacyText }}</p>
      </div>

      <div class="closing__countdown" data-closing-reveal>
        <p class="closing__intro">{{ content.countdownIntro }}</p>
        <time class="closing__date" :datetime="date.iso">{{ date.display }}</time>
        <div
          v-if="remaining && !remaining.complete"
          class="closing__timer"
          role="timer"
          aria-live="off"
          aria-label="Time remaining until the start of the wedding day"
        >
          <div class="closing__unit">
            <strong>{{ remaining.days }}</strong
            ><span>Days</span>
          </div>
          <div class="closing__unit">
            <strong>{{ pad(remaining.hours) }}</strong
            ><span>Hours</span>
          </div>
          <div class="closing__unit">
            <strong>{{ pad(remaining.minutes) }}</strong
            ><span>Minutes</span>
          </div>
          <div class="closing__unit">
            <strong>{{ pad(remaining.seconds) }}</strong
            ><span>Seconds</span>
          </div>
        </div>
        <p v-else-if="remaining?.complete" class="closing__complete" role="status">{{ completedMessage }}</p>
        <p v-else class="closing__complete">Countdown details will be shared soon.</p>
        <p v-if="date.countdownTarget?.note && !remaining?.complete" class="closing__target-note">
          {{ date.countdownTarget.note }}
        </p>
      </div>

      <div class="closing__message" data-closing-reveal>
        <p>{{ content.reminder }}</p>
        <p class="closing__deadline">{{ content.deadlineNote }}</p>
      </div>
    </div>
  </section>
</template>
