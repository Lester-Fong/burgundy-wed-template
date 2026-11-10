<script setup lang="ts">
import type { WeddingContent } from '../../../types/wedding'

defineProps<{ content: NonNullable<WeddingContent['gifts']> }>()
</script>

<template>
  <section class="section section--ivory gifts" aria-labelledby="gifts-title">
    <div class="gifts__inner">
      <h2 id="gifts-title" class="gifts__heading">Gift Guide</h2>

      <div class="gifts__art" data-gift-reveal>
        <img
          :src="content.artwork.src"
          :alt="content.artwork.alt"
          :width="content.artwork.width"
          :height="content.artwork.height"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div class="gifts__content">
        <div class="gifts__message" data-gift-reveal>
          <p>{{ content.message }}</p>
          <p>{{ content.optionsIntro }}</p>
        </div>

        <div class="gifts__options" aria-label="Gift options" data-gift-reveal>
          <div v-for="option in content.options" :key="option.id" class="gifts__option">
            <h3>{{ option.label }}</h3>
            <div class="gifts__qr-square">
              <img
                v-if="option.approved && option.qrImage"
                :src="option.qrImage.src"
                :alt="option.qrImage.alt"
                loading="lazy"
                decoding="async"
              />
              <svg v-else viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M8 19V8h11M29 8h11v11M40 29v11H29M19 40H8V29" />
                <path d="M20 20h8v8h-8z" />
              </svg>
            </div>
            <p v-if="!option.approved || !option.qrImage" class="gifts__pending">QR pending</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
