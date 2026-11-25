<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { WeddingContent } from '../../types/wedding'
import EnvelopeIntro from './components/EnvelopeIntro.vue'
import WeddingHero from './components/WeddingHero.vue'
import PhotoDivider from './components/PhotoDivider.vue'
import WelcomeMusicSection from './components/WelcomeMusicSection.vue'
import EntourageSection from './components/EntourageSection.vue'
import VenuesSection from './components/VenuesSection.vue'
import AttireGuide from './components/AttireGuide.vue'
import TimelineSection from './components/TimelineSection.vue'
import GiftGuide from './components/GiftGuide.vue'
import RemindersSection from './components/RemindersSection.vue'
import FaqSection from './components/FaqSection.vue'
import CountdownSection from './components/CountdownSection.vue'
import WeddingFooter from './components/WeddingFooter.vue'
import FloatingMusicPlayer from './components/FloatingMusicPlayer.vue'
import { useScrollReveal } from './composables/useScrollReveal'

const props = defineProps<{ content: WeddingContent }>()
const opened = ref(false)
const main = ref<HTMLElement | null>(null)
const music = ref<InstanceType<typeof FloatingMusicPlayer> | null>(null)
const site = ref<HTMLElement | null>(null)
const musicPlaying = computed(() => music.value?.playing ?? false)
const musicError = computed(() => music.value?.error ?? false)

useScrollReveal(site)

function openInvitation(withMusic: boolean) {
  if (withMusic) void music.value?.play()
}

function toggleMusic() {
  music.value?.toggle()
}

async function finishOpening() {
  opened.value = true
  await nextTick()
  main.value?.focus({ preventScroll: true })
}

watch(opened, (value) => {
  document.body.style.overflow = value ? '' : 'hidden'
})
onMounted(() => {
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div ref="site" class="wedding-site">
    <EnvelopeIntro
      v-if="!opened"
      :couple="content.couple"
      :date="content.date"
      @open="openInvitation"
      @finish="finishOpening"
    />
    <main ref="main" class="wedding-main" tabindex="-1" :inert="!opened" :aria-hidden="!opened">
      <WeddingHero :couple="content.couple" :date="content.date" :image="content.images.hero" />
      <WelcomeMusicSection
        v-if="content.welcome"
        :content="content.welcome"
        :has-music="!!content.music"
        :playing="musicPlaying"
        :error="musicError"
        @toggle-music="toggleMusic"
      />
      <PhotoDivider
        v-if="content.images.entourageDivider && content.entourage"
        :image="content.images.entourageDivider"
      />
      <EntourageSection v-if="content.entourage?.groups.length" :content="content.entourage" />
      <PhotoDivider
        v-if="content.venues && content.images.venuesDivider"
        :image="content.images.venuesDivider"
      />
      <VenuesSection v-if="content.venues?.items.length" :content="content.venues" />
      <AttireGuide v-if="content.attire" :content="content.attire" />
      <TimelineSection
        v-if="content.timeline?.events.length"
        :content="content.timeline"
        :image="content.images.timeline ?? content.images.hero"
      />
      <GiftGuide v-if="content.gifts" :content="content.gifts" />
      <PhotoDivider
        v-if="content.reminders?.items.length && content.images.remindersDivider"
        :image="content.images.remindersDivider"
      />
      <RemindersSection v-if="content.reminders?.items.length" :content="content.reminders" />
      <PhotoDivider
        v-if="content.faqs?.length && content.images.faqsDivider"
        :image="content.images.faqsDivider"
      />
      <FaqSection v-if="content.faqs?.length" :items="content.faqs" />
      <CountdownSection v-if="content.closing" :date="content.date" :content="content.closing" />
      <WeddingFooter :couple="content.couple" :content="content.footer" />
    </main>
    <FloatingMusicPlayer v-if="content.music" ref="music" :music="content.music" :visible="opened" />
  </div>
</template>
