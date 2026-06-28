<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="Jogos do dia">
      <template #right>
        <DatePicker v-model="selectedDate" />
      </template>
    </PageHeader>

    <FixturesList :fixtures="fixtures" :bets="bets" :loading="isLoading" @source-change="onSourceChange" />
  </div>
</template>

<script setup>
const apiUrl = useRuntimeConfig().public.API_URL

const selectedDate = ref('')
const isLoading = ref(true)
const source = ref('bookie')
const fixtures = ref([])
const bets = ref([])
const fetchError = ref(null)

const { data } = await useFetch(`${apiUrl}/fixtures/daily`, {
  query: { source: source.value },
  onResponse({ response }) {
    if (response?.ok && response._data) {
      const parsed = safeParse('fixturesDaily', response._data)
      response._data = parsed
    }
  },
})

if (data.value) {
  selectedDate.value = data.value.date
  fixtures.value = data.value.fixtures
  bets.value = data.value.bets
}

isLoading.value = false

async function fetchDaily() {
  isLoading.value = true
  fetchError.value = null
  try {
    const result = await $fetch(`${apiUrl}/fixtures/daily`, {
      query: { date: selectedDate.value, source: source.value },
    })
    const parsed = safeParse('fixturesDaily', result)
    fixtures.value = parsed.fixtures || []
    bets.value = parsed.bets || []
  } catch {
    fetchError.value = true
  } finally {
    isLoading.value = false
  }
}

watch(selectedDate, () => {
  fetchDaily()
})

function onSourceChange(newSource) {
  source.value = newSource
  fetchDaily()
}
</script>

<style lang="scss" scoped></style>
