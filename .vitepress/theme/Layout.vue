<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import Breadcrumbs from './Breadcrumbs.vue'
import Footer from './Footer.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-before>
      <Breadcrumbs />
    </template>
    <template #layout-bottom>
      <Footer />
    </template>
  </Layout>
</template>
