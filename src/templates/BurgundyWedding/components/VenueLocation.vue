<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { safeGoogleMapsUrl } from '../../../utils/links'

const props = defineProps<{ venueName: string; verifiedMapUrl?: string }>()
const destination = computed(() => safeGoogleMapsUrl(props.verifiedMapUrl))
const qrDataUrl = ref<string>()
const qrFailed = ref(false)

watch(
  destination,
  async (url, _previous, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
    })
    qrDataUrl.value = undefined
    qrFailed.value = false
    if (!url) return

    try {
      const { default: QRCode } = await import('qrcode')
      const image = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        margin: 4,
        width: 144,
        color: { dark: '#51091B', light: '#F8F3EB' },
      })
      if (active) qrDataUrl.value = image
    } catch {
      if (active) qrFailed.value = true
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="venue-location">
    <p class="venue-location__label">{{ destination ? 'Scan to locate' : 'Location details' }}</p>
    <div v-if="qrDataUrl" class="venue-location__qr">
      <img
        :src="qrDataUrl"
        :alt="`QR code for ${venueName} on Google Maps`"
        :data-destination="destination"
        width="144"
        height="144"
      />
    </div>
    <div
      v-else
      class="venue-location__pending"
      :aria-label="destination ? 'Location QR unavailable' : 'Location QR pending verified map link'"
    >
      <span aria-hidden="true">QR</span>
      <small>{{
        qrFailed ? 'Map code unavailable' : destination ? 'Preparing map code' : 'Awaiting verified map'
      }}</small>
    </div>

    <a
      v-if="destination"
      class="venue-location__button"
      :href="destination"
      target="_blank"
      rel="noopener noreferrer"
    >
      Locate via maps
    </a>
    <span v-else class="venue-location__button venue-location__button--pending" aria-disabled="true">
      Map link pending
    </span>
  </div>
</template>
