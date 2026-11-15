<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

const footerText = {
  en: {
    tagline: 'Learn languages with manga, take notes.',
    copyright: '© 2026 PayayaKamo · KomaYomi — Manga Learner',
  },
  zh: {
    tagline: '用漫画学语言，做笔记。',
    copyright: '© 2026 PayayaKamo · KomaYomi — Manga Learner',
  },
  ja: {
    tagline: '漫画で言語を学び、ノートを取る。',
    copyright: '© 2026 PayayaKamo · KomaYomi — Manga Learner',
  },
} as const

const locale = computed<'en' | 'zh' | 'ja'>(() => {
  if (route.path === '/zh/' || route.path.startsWith('/zh/')) return 'zh'
  if (route.path === '/ja/' || route.path.startsWith('/ja/')) return 'ja'
  return 'en'
})

const text = computed(() => footerText[locale.value])
</script>

<template>
  <footer class="mm-footer">
    <div class="mm-footer__inner">
      <p class="mm-footer__tagline">{{ text.tagline }}</p>
      <p class="mm-footer__copy">{{ text.copyright }}</p>
    </div>
  </footer>
</template>
