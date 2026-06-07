<template>
  <div class="flex items-center gap-1">
    <UButton icon="i-lucide-chevron-left" size="xs" color="secondary" variant="soft" @click="goPrev" />

    <UPopover v-model:open="popoverOpen" :popper="{ placement: 'bottom' }">
      <UButton
        :label="modelValue ? formatDate(modelValue) : ''"
        size="xs"
        color="secondary"
        variant="soft"
        class="w-28 justify-center"
      />

      <template #content>
        <UCalendar v-model="calendarValue" :max-value="maxCalendar" @update:model-value="onCalendarSelect" />
      </template>
    </UPopover>

    <UButton
      icon="i-lucide-chevron-right"
      size="xs"
      color="secondary"
      variant="soft"
      :disabled="isAtMax"
      @click="goNext"
    />
  </div>
</template>

<script setup>
import { CalendarDate } from '@internationalized/date'

const props = defineProps({
  modelValue: { type: String, default: '' },
  maxValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function isoToCalendarDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new CalendarDate(y, m, d)
}

function calendarDateToIso(cal) {
  if (!cal) return ''
  return `${cal.year}-${String(cal.month).padStart(2, '0')}-${String(cal.day).padStart(2, '0')}`
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const calendarValue = ref(isoToCalendarDate(props.modelValue))
const maxCalendar = computed(() => isoToCalendarDate(props.maxValue) || isoToCalendarDate(todayIso()))
const popoverOpen = ref(false)

const isAtMax = computed(() => {
  if (!calendarValue.value) return false
  return calendarDateToIso(calendarValue.value) === (props.maxValue || todayIso())
})

function onCalendarSelect(newCal) {
  if (!newCal) return
  calendarValue.value = newCal
  emit('update:modelValue', calendarDateToIso(newCal))
  popoverOpen.value = false
}

function goPrev() {
  if (!calendarValue.value) return
  const cur = calendarValue.value
  const d = new Date(cur.year, cur.month - 1, cur.day - 1)
  const newCal = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
  calendarValue.value = newCal
  emit('update:modelValue', calendarDateToIso(newCal))
}

function goNext() {
  if (!calendarValue.value) return
  if (isAtMax.value) return
  const cur = calendarValue.value
  const d = new Date(cur.year, cur.month - 1, cur.day + 1)
  const newCal = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
  calendarValue.value = newCal
  emit('update:modelValue', calendarDateToIso(newCal))
}

watch(
  () => props.modelValue,
  (newIso) => {
    if (!newIso) return
    const newCal = isoToCalendarDate(newIso)
    if (newCal && (!calendarValue.value || calendarDateToIso(calendarValue.value) !== newIso)) {
      calendarValue.value = newCal
    }
  },
)
</script>
