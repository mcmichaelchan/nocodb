<script lang="ts" setup>
import tinycolor from 'tinycolor2'
import type { VNodeRef } from '@vue/runtime-core'
import type { Select as AntSelect } from 'ant-design-vue'
import type { SelectOptionType } from 'nocodb-sdk'
import {
  ActiveCellInj,
  ColumnInj,
  IsKanbanInj,
  ReadonlyInj,
  computed,
  inject,
  ref,
  watch,
  reactive,
  useGlobal,
  useDebounceFn,
} from '#imports'

interface Props {
  modelValue?: string | undefined
}

const { appInfo } = $(useGlobal())

const baseURL = appInfo.ncSiteUrl

let lastFetchId = 0

const { modelValue } = defineProps<Props>()

const emit = defineEmits(['update:modelValue'])

const column = inject(ColumnInj)!

const readOnly = inject(ReadonlyInj)!

const state = reactive({
  data: [],
  value: [],
  fetching: false,
})

const userSelectorMeta = $computed(() => {
  return {
    multiple: false,
    ...(column?.value?.meta || {}),
  }
})

const vModel = $computed({
  get: () => (modelValue || '').split(',').filter(Boolean),
  set: (val) => {
    if (userSelectorMeta.multiple) {
      emit('update:modelValue', val.join(','))
    } else {
      emit('update:modelValue', Array.isArray(val) && val.length ? val[val.length - 1] : '')
    }
  },
})

const isKanban = inject(IsKanbanInj, ref(false))

const fetchUser = useDebounceFn((value) => {
  lastFetchId += 1
  const fetchId = lastFetchId
  state.data = []
  state.fetching = true
  console.log(baseURL)
  fetch(
    `${
      baseURL.indexOf('my.fusion.woa.com') > -1 ? baseURL.replace('http', 'https') : baseURL
    }/api/v1/auth/power/search?name=${value}`,
  )
    .then((response) => response.json())
    .then((body) => {
      if (fetchId !== lastFetchId) {
        // for fetch callback order
        return
      }
      state.data = body.data.data.map(({ value }: any) => ({ label: value, value }))
      state.fetching = false
    })
}, 300)

const focus: VNodeRef = (el) => (el as HTMLTextAreaElement)?.focus()
</script>

<template>
  <a-select
    v-if="!readOnly"
    v-model:value="vModel"
    mode="multiple"
    :ref="focus"
    placeholder="搜索用户"
    style="width: 100%"
    :filter-option="false"
    :not-found-content="state.fetching ? undefined : null"
    :options="state.data"
    @search="fetchUser"
    :disabled="readOnly"
    @keydown.stop
    id="user-selector"
  >
    <template v-if="state.fetching" #notFoundContent>
      <a-spin size="small" />
    </template>
  </a-select>
  <div v-else>
    <a-tag v-for="user in vModel" :key="user">{{ user }}</a-tag>
  </div>
</template>

<style scoped lang="scss">
:deep(.ant-select-selection-search .ant-select-selection-search-input) {
  box-shadow: none !important;
  padding: 0 !important;
}
</style>
<!--
/**
 * @copyright Copyright (c) 2021, Xgene Cloud Ltd
 *
 * @author Naveen MR <oof1lab@gmail.com>
 * @author Pranav C Balan <pranavxc@gmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
-->
