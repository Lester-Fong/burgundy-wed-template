<script setup lang="ts">
import BurgundyWedding from '../templates/BurgundyWedding/BurgundyWedding.vue'
import { weddingContent } from '../data/wedding-content'
</script>

<template>
  <BurgundyWedding :content="weddingContent" />
</template>
