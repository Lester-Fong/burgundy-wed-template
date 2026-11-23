<script setup lang="ts">
import type { WeddingContent } from '../../../types/wedding'
import { safeHexColor } from '../../../utils/colors'

defineProps<{ content: NonNullable<WeddingContent['attire']> }>()
</script>

<template>
  <section class="section section--ivory attire" aria-labelledby="attire-title">
    <div class="attire__inner">
      <header class="attire__heading">
        <h2 id="attire-title">Attire Guide</h2>
        <p class="attire__guidance">{{ content.guidance }}</p>
        <span class="attire__rule" aria-hidden="true"></span>
      </header>

      <div class="attire__groups">
        <section
          v-if="content.sponsorLooks.length || content.sponsorColors.length"
          class="attire__group attire__group--sponsors"
          aria-labelledby="attire-sponsors-title"
        >
          <h3 id="attire-sponsors-title">{{ content.sponsorHeading }}</h3>
          <p class="attire__group-intro">{{ content.sponsorCaption }}</p>
          <div v-if="content.sponsorLooks.length" class="attire__lineup attire__lineup--sponsors">
            <figure v-for="look in content.sponsorLooks" :key="look.id" class="attire__look">
              <img
                :src="look.illustration.src"
                :alt="look.illustration.alt"
                :width="look.illustration.width"
                :height="look.illustration.height"
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
          <section
            v-if="content.sponsorColors.length"
            class="attire__assignments"
            aria-labelledby="attire-assignments-title"
          >
            <h4 id="attire-assignments-title">Principal Sponsor Colors</h4>
            <div class="attire__legend">
              <div v-for="item in content.sponsorColors" :key="item.role" class="attire__legend-item">
                <span
                  class="attire__legend-dot"
                  :style="{ backgroundColor: safeHexColor(item.color.hex) }"
                  aria-hidden="true"
                ></span>
                <div>
                  <strong>{{ item.role }}</strong>
                  <span
                    >{{ item.color.name }} <small>{{ item.color.hex }}</small></span
                  >
                </div>
              </div>
            </div>
          </section>
        </section>

        <section
          v-if="content.guestLooks.length || content.guestColors.length"
          class="attire__group attire__group--guests"
          aria-labelledby="attire-guests-title"
        >
          <h3 id="attire-guests-title">{{ content.guestHeading }}</h3>
          <p class="attire__group-intro">{{ content.guestCaption }}</p>
          <div v-if="content.guestLooks.length" class="attire__lineup attire__lineup--guests">
            <figure v-for="look in content.guestLooks" :key="look.id" class="attire__look">
              <img
                :src="look.illustration.src"
                :alt="look.illustration.alt"
                :width="look.illustration.width"
                :height="look.illustration.height"
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
          <div class="attire__guest-palette" aria-label="Guest dress code colors">
            <div v-for="color in content.guestColors" :key="color.name" class="attire__guest-color">
              <span
                class="attire__guest-dot"
                :style="{ backgroundColor: safeHexColor(color.hex) }"
                aria-hidden="true"
              ></span>
              <strong>{{ color.name }}</strong>
              <small>{{ color.hex }}</small>
            </div>
          </div>
        </section>
      </div>

      <footer class="attire__notes">
        <h3>{{ content.notesHeading }}</h3>
        <p>{{ content.restrictedColors }}</p>
        <p v-if="content.closingNote" class="attire__thanks">{{ content.closingNote }}</p>
      </footer>
    </div>
  </section>
</template>
