<script setup lang="ts">
import type { TabItem } from '~/composables'
import { TabMetaInj } from '#imports'

const { getMeta } = useMetas()

const { project, projectLoadedHook } = useProject()

const route = useRoute()

const activeTab = inject(
  TabMetaInj,
  computed(() => ({} as TabItem)),
)

if (!project.value.id) {
  projectLoadedHook(async () => {
    await getMeta(route.params.title as string, true)
  })
} else {
  getMeta(route.params.title as string, true)
}
</script>

<template>
  <LazyTabsSmartsheet :key="route.params.title" :active-tab="activeTab" />
</template>
