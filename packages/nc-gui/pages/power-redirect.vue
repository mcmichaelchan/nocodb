<script setup lang="ts">
import { definePageMeta, navigateTo, onMounted, useGlobal } from '#imports'

const { signIn } = useGlobal()
const route = useRoute()

definePageMeta({
  requiresAuth: false,
  title: 'title.resetPassword',
})

onMounted(async () => {
  const token = route.query.token
  if (token) {
    signIn(token as string)
    await navigateTo('/')
  }
})
</script>

<template>
  <NuxtLayout>
    <p>登录成功，跳转中...</p>
  </NuxtLayout>
</template>
