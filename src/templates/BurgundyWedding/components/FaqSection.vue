<script setup lang="ts">
import type { Faq } from '../../../types/wedding'
defineProps<{ items: Faq[] }>()
</script>

<template>
  <section class="section section--ivory faqs" aria-labelledby="faq-title">
    <h2 id="faq-title" class="faqs__title">Frequently Asked<br />Questions</h2>
    <div class="faqs__list">
      <article v-for="item in items" :key="item.question" class="faq" data-faq-reveal>
        <div class="faq__header">
          <svg class="faq__heart" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 21.1 3.2 12.8a5.7 5.7 0 0 1 8.8-7.2 5.7 5.7 0 0 1 8.8 7.2L12 21.1Z" />
          </svg>
          <h3 class="faq__question">{{ item.question }}</h3>
        </div>
        <div class="faq__answer">
          <p v-for="(paragraph, index) in item.answer" :key="index">{{ paragraph }}</p>
        </div>
      </article>
    </div>
  </section>
</template>
