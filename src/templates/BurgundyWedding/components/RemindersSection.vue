<script setup lang="ts">
import type { RemindersContent } from '../../../types/wedding'

defineProps<{ content: RemindersContent }>()
</script>

<template>
  <section class="section section--burgundy reminders" aria-labelledby="reminders-title">
    <div class="reminders__inner">
      <h2 id="reminders-title" class="reminders__heading" data-reminders-reveal>
        <span>{{ content.heading[0] + ' ' }}</span>
        <span>{{ content.heading[1] }}</span>
      </h2>

      <div class="reminders__grid">
        <article v-for="item in content.items" :key="item.id" class="reminder" data-reminders-reveal>
          <img
            class="reminder__ornament"
            :src="content.ornament.src"
            :alt="content.ornament.alt"
            :width="content.ornament.width"
            :height="content.ornament.height"
            loading="lazy"
            decoding="async"
          />
          <h3>{{ item.title }}</h3>
          <p v-for="paragraph in item.paragraphs" :key="paragraph">{{ paragraph }}</p>
          <p v-if="item.eventTime" class="reminder__detail">
            {{ item.eventTime.label }} {{ item.eventTime.display }}
          </p>
          <p v-if="item.hashtag" class="reminder__detail">{{ item.hashtag }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
