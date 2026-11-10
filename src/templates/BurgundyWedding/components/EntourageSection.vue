<script setup lang="ts">
import type { WeddingContent } from '../../../types/wedding'
defineProps<{ content: NonNullable<WeddingContent['entourage']> }>()
</script>

<template>
  <section id="entourage" class="section section--ivory entourage" aria-labelledby="entourage-title">
    <div class="entourage__inner">
      <h2 id="entourage-title">The Entourage</h2>
      <p v-if="content.intro" class="entourage__intro" data-entourage-reveal>{{ content.intro }}</p>

      <div class="entourage__program">
        <div
          v-for="group in content.groups"
          :key="group.id"
          class="entourage__group"
          :class="`entourage__group--${group.layout}`"
          :data-entourage-id="group.id"
          data-entourage-reveal
        >
          <template v-if="group.layout === 'single'">
            <p v-if="group.description" class="entourage__description">{{ group.description }}</p>
            <h3 class="entourage__role">{{ group.heading }}</h3>
            <ul class="entourage__names">
              <li v-for="person in group.people" :key="person.name" class="entourage__name">
                {{ person.name }}
              </li>
            </ul>
          </template>

          <template v-else-if="group.layout === 'paired'">
            <p v-if="group.description" class="entourage__description">{{ group.description }}</p>
            <h3 v-if="group.heading" class="entourage__role">{{ group.heading }}</h3>
            <div class="entourage__pair">
              <div v-for="(column, index) in group.columns" :key="index" class="entourage__column">
                <h3 v-if="!group.heading && column.heading" class="entourage__role">
                  {{ column.heading }}
                </h3>
                <h4 v-else-if="column.heading" class="entourage__role entourage__role--sub">
                  {{ column.heading }}
                </h4>
                <p v-if="column.description" class="entourage__description">{{ column.description }}</p>
                <ul class="entourage__names">
                  <li v-for="person in column.people" :key="person.name" class="entourage__name">
                    {{ person.name }}
                  </li>
                </ul>
              </div>
            </div>
          </template>

          <template v-else>
            <p v-if="group.description" class="entourage__description">{{ group.description }}</p>
            <h3 class="entourage__role">{{ group.heading }}</h3>
            <div class="entourage__chapter-roles">
              <div v-for="role in group.roles" :key="role.heading" class="entourage__chapter-role">
                <h4 class="entourage__role entourage__role--sub">{{ role.heading }}</h4>
                <p v-if="role.description" class="entourage__description">{{ role.description }}</p>
                <ul class="entourage__names">
                  <li v-for="person in role.people" :key="person.name" class="entourage__name">
                    {{ person.name }}
                  </li>
                </ul>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
