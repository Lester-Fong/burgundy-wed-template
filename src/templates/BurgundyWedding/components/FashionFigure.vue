<script setup lang="ts">
import { computed } from 'vue'
import type { FashionVariant, OutfitColors } from '../../../types/wedding'
import { safeHexColor } from '../../../utils/colors'

const props = defineProps<{ variant: FashionVariant; colors: OutfitColors; label: string }>()
const isDress = computed(() => props.variant === 'gown' || props.variant === 'cocktail-dress')
const palette = computed(() => ({
  '--outfit-primary': safeHexColor(props.colors.primary),
  '--outfit-secondary': safeHexColor(props.colors.secondary, '#BDA88D'),
  '--outfit-accent': safeHexColor(props.colors.accent, '#E8C48C'),
}))
</script>

<template>
  <svg
    class="fashion-figure"
    :class="`fashion-figure--${variant}`"
    :style="palette"
    viewBox="0 0 120 320"
    role="img"
    :aria-label="label"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{{ label }}</title>
    <!-- Shared figure anatomy and restrained ink details are independent of outfit colors. -->
    <path class="figure-shadow" d="M18 309c22-5 61-5 84 0-21 6-63 7-84 0Z" />
    <template v-if="isDress">
      <g transform="translate(15 11) scale(.75)">
        <path
          class="figure-hair"
          d="M40 32c0-19 10-27 22-27 16 0 25 12 23 32-1 17 7 34 8 50-8-1-14-7-17-17H45C40 82 33 86 27 86c5-18 12-36 13-54Z"
        />
        <path class="figure-hair-shine" d="M44 25c9-17 29-18 37-2M82 41c0 12 5 24 8 31" />
        <ellipse class="figure-skin figure-outline" cx="61" cy="39" rx="16" ry="23" />
        <path class="figure-face" d="M54 39h3m10 0h3m-12 12c3 2 6 2 9 0" />
      </g>
      <path class="figure-skin figure-outline" d="M54 59v13l7 7 8-7V59Z" />
      <path
        class="figure-skin figure-outline"
        d="M41 82c-7 7-12 22-15 42l-7 47 5 2 15-48 12-31Zm40 0c8 6 13 19 16 42l5 47-5 2-14-46-12-31Z"
      />
      <path class="figure-skin figure-outline" d="m19 169-2 12 6 4 4-9-3-7Zm78 0 2 12-6 4-4-9 3-7Z" />
    </template>
    <template v-else>
      <g transform="translate(15 11) scale(.75)">
        <path class="figure-hair" d="M42 29c-1-17 11-26 23-25 17 0 24 13 20 31l-6-7-3-10c-7 7-19 7-30 10Z" />
        <ellipse class="figure-skin figure-outline" cx="62" cy="40" rx="16" ry="22" />
        <path class="figure-face" d="M56 40h3m9 0h3m-11 11c2 1 5 1 7 0" />
      </g>
      <path class="figure-skin figure-outline" d="M55 59v12l7 7 8-7V59Z" />
      <path
        class="figure-skin figure-outline"
        d="m36 85-12 13-8 61 5 3 15-54 10-11Zm51 0 11 13 8 61-5 3-15-54-10-11Z"
      />
      <path class="figure-skin figure-outline" d="m16 158-2 13 6 4 4-12Zm85 0 2 13-6 4-4-12Z" />
    </template>

    <template v-if="variant === 'gown'">
      <path
        class="garment-primary figure-outline"
        d="M49 71c-7 3-11 9-12 20l3 50-25 154c20 8 71 9 91 0L81 141l3-50c-1-11-6-17-13-20l-10 13Z"
      />
      <path class="garment-secondary" d="M39 143c14 8 30 9 43 0l18 147c-8 5-16 7-25 8-5-57-16-107-36-155Z" />
      <path
        class="garment-shade"
        d="M54 146c-10 52-21 103-32 146m49-141c4 41 9 89 13 141M39 92c11 5 30 5 44 0"
      />
      <path class="garment-accent figure-outline" d="M40 139c14 5 29 5 42 0l2 7c-17 5-29 5-47 0Z" />
      <path
        class="figure-ink"
        d="M49 71c1 11 6 19 12 24 7-6 10-14 10-24M37 91l-4 27m51-27 4 27M20 291c25 9 54 9 80 0"
      />
      <path class="figure-highlight" d="M51 110c-4 10-5 20-5 27m11 20-19 112" />
    </template>

    <template v-else-if="variant === 'cocktail-dress'">
      <path
        class="garment-primary figure-outline"
        d="M49 71c-8 2-11 10-12 21l3 51-25 83c19 12 71 12 91 0l-25-83 3-51c-1-11-5-19-13-21l-10 13Z"
      />
      <path class="garment-secondary" d="M40 144c13 7 31 7 42 0l18 78c-10 6-20 8-31 9l-12-74Z" />
      <path class="garment-accent figure-outline" d="M38 138c15 5 29 5 46 0l2 7c-17 5-31 5-50 0Z" />
      <path
        class="figure-ink"
        d="M49 71c2 9 6 17 12 23 6-6 9-13 10-23M39 99l-2 22m47-22 2 22m-65 99c23 7 55 7 78 0"
      />
      <path class="figure-highlight" d="M52 157c-8 18-13 36-19 53" />
      <path class="figure-skin figure-outline" d="m38 230-2 57 9 2 8-58Zm35 1 5 58 9-2-1-57Z" />
      <path
        class="figure-hair figure-outline"
        d="m35 286-5 13c5 4 17 4 22 1l-2-11Zm42 3-1 11c5 3 17 3 22-1l-5-13Z"
      />
    </template>

    <template v-else-if="variant === 'suit'">
      <path class="garment-secondary figure-outline" d="M46 69h32l-4 88H50Z" />
      <path class="garment-accent figure-outline" d="m58 73 4 9 4-9-2 13 6 38-8 10-8-10 6-38Z" />
      <path
        class="garment-primary figure-outline"
        d="m50 69-20 10-5 67 20 5 7-48-3 57h28l-2-57 7 48 17-5-5-67-20-10-12 15Z"
      />
      <path class="garment-shade" d="m50 70 12 22-9 42-4-31Zm24 0L62 92l9 42 5-31Z" />
      <path
        class="figure-ink"
        d="m50 69 12 22-13 42 13 12m12-76L62 91l13 42-13 12M43 151h39m-36-43 1 20m31-20-1 20"
      />
      <circle class="figure-button" cx="63" cy="142" r="1.4" />
      <path class="garment-primary figure-outline" d="M48 159h29l6 129-17 2-5-97-5 97-17-2Z" />
      <path class="garment-shade" d="M61 179v107m-18-123 5 119m29-119-4 119" />
      <path
        class="figure-hair figure-outline"
        d="m38 287-8 13c8 6 21 5 28 0l-2-12Zm29 1-2 12c7 5 20 6 28 0l-8-13Z"
      />
    </template>

    <template v-else>
      <path
        class="garment-primary figure-outline"
        d="m48 70-17 10-6 70 20 3 4-48-3 57h32l-3-57 6 48 18-3-6-70-17-10-14 12Z"
      />
      <path class="garment-secondary" d="M48 70c3 7 8 11 14 13 6-2 11-6 14-13l4 85H44Z" />
      <path class="garment-shade" d="M40 89v55m43-55v55M50 99v50m24-50v50" />
      <path class="figure-ink" d="m48 70 14 13 14-13M62 83v78m-17 0h34M34 121l-4 21m59-21 4 21" />
      <path class="garment-accent" d="M54 102h2v45h-2Zm7 0h2v45h-2Zm7 0h2v45h-2Z" />
      <path class="garment-primary figure-outline" d="M47 162h31l5 126-17 2-4-94-5 94-18-2Z" />
      <path class="garment-shade" d="M62 179v107m-18-121 5 117m28-117-4 117" />
      <path
        class="figure-hair figure-outline"
        d="m38 287-8 13c8 6 21 5 28 0l-2-12Zm29 1-2 12c7 5 20 6 28 0l-8-13Z"
      />
    </template>
  </svg>
</template>
