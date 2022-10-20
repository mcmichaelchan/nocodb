<script setup lang="ts">
import { useVModel } from '#imports'

const props = defineProps<{
  value: any
}>()

const emit = defineEmits(['update:value'])

const vModel = useVModel(props, 'value', emit)

// set default value
vModel.value.meta = {
  multiple: false,
  ...vModel.value.meta,
}
</script>

<template>
  <a-row>
    <a-form-item label="multiple">
      <a-switch v-model:checked="vModel.meta.multiple" />
    </a-form-item>
  </a-row>
</template>

<style scoped lang="scss"></style>
