<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'

const route = useRoute()
const { page } = useData()

const labels = {
  en: { home: 'Home', guide: 'Guide' },
  zh: { home: '首页', guide: '使用指南' },
  ja: { home: 'ホーム', guide: 'ガイド' },
} as const

const locale = computed<'en' | 'zh' | 'ja'>(() => {
  const path = route.path
  if (path === '/zh/' || path.startsWith('/zh/')) return 'zh'
  if (path === '/ja/' || path.startsWith('/ja/')) return 'ja'
  return 'en'
})

const isHomePage = computed(() => ['/', '/zh/', '/ja/'].includes(route.path))
const isNotFound = computed(() => route.path.includes('/404'))
const homeLink = computed(() => (locale.value === 'en' ? '/' : `/${locale.value}/`))

const guideLink = computed(() => `${homeLink.value}guide/introduction`)

const inGuide = computed(() => {
  const path = route.path.replace(/^\/(zh|ja)\//, '/')
  return path.startsWith('/guide/')
})

const crumbs = computed(() => {
  const items: Array<{ text: string; link: string }> = [
    { text: labels[locale.value].home, link: homeLink.value },
  ]
  if (inGuide.value) {
    items.push({ text: labels[locale.value].guide, link: guideLink.value })
  }
  const title = page.value.title
  if (title) items.push({ text: title, link: '' })
  return items
})
</script>

<template>
  <nav
    v-if="!isHomePage && !isNotFound && crumbs.length > 1"
    class="mm-crumbs"
    aria-label="Breadcrumb"
  >
    <ol>
      <li v-for="(crumb, index) in crumbs" :key="`${crumb.text}-${index}`">
        <a v-if="crumb.link && index < crumbs.length - 1" :href="withBase(crumb.link)">
          {{ crumb.text }}
        </a>
        <span v-else aria-current="page">{{ crumb.text }}</span>
        <span v-if="index < crumbs.length - 1" class="mm-crumbs__sep" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>
