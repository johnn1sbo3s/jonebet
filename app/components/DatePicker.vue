<template>
  <div class="inline-flex items-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
    <button
      type="button"
      class="hover:bg-elevated flex h-8 items-center justify-center px-2.5 text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Data anterior"
      @click="goPrev"
    >
      <UIcon name="i-lucide-chevron-left" class="size-4" />
    </button>

    <UPopover v-model:open="popoverOpen" :popper="{ placement: 'bottom' }">
      <button
        type="button"
        class="hover:bg-elevated focus-visible:ring-primary/40 flex h-8 w-28 items-center justify-center gap-1.5 border-x border-zinc-800 px-2.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span>{{ modelValue ? formatDate(modelValue) : '' }}</span>

        <UIcon name="i-lucide-chevron-down" class="size-3.5 text-zinc-400" />
      </button>

      <template #content>
        <UCalendar v-model="calendarValue" :max-value="maxCalendar" @update:model-value="onCalendarSelect" />
      </template>
    </UPopover>

    <button
      type="button"
      class="hover:bg-elevated flex h-8 items-center justify-center px-2.5 text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Próxima data"
      :disabled="isAtMax"
      @click="goNext"
    >
      <UIcon name="i-lucide-chevron-right" class="size-4" />
    </button>
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
