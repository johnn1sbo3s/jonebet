<template>
  <div class="flex flex-col gap-5">
    <div class="flex justify-between">
      <PageHeader title="Apostas do dia" />
    </div>

    <div class="flex items-center gap-2">
      <USelect v-model="date" class="w-1/2 sm:w-1/5" :options="dates" />

      <USelect v-model="selectedModel" class="w-1/2 sm:w-1/5" :options="modelsOptions" />
    </div>

    <div>
      <div class="mb-3 flex items-center justify-between">
        <div v-if="bets.length > 0" class="text-sm text-zinc-400">{{ qtd_games }} apostas encontradas</div>

        <UButton icon="i-lucide-download" variant="soft" color="blue" @click="exportTableToExcel(bets)">
          Download
        </UButton>
      </div>

      <UTable
        :ui="{
          wrapper: 'relative overflow-x-auto border border-zinc-800 rounded-xl',
          th: 'bg-zinc-950 text-zinc-400 text-xs uppercase',
          td: 'border-t border-zinc-800 text-zinc-300',
        }"
        :rows="bets"
        :columns="columns"
        :sort="sort"
        class="bg-zinc-900"
      />
    </div>
  </div>
</template>

<script setup>
const runtimeConfig = useRuntimeConfig()
const apiUrl = runtimeConfig.public.API_URL

const sort = { column: 'Time', direction: 'asc' }

const columns = [
  { id: 'Date', key: 'Date', label: 'Data' },
  { id: 'Time', key: 'Time', label: 'Horário', sortable: true },
  { id: 'Home', key: 'Home', label: 'Casa', sortable: true },
  { id: 'Away', key: 'Away', label: 'Fora', sortable: true },
  { id: 'FT_Odds_H', key: 'FT_Odds_H', label: 'Odds casa' },
  { id: 'FT_Odds_D', key: 'FT_Odds_D', label: 'Odds empate' },
  { id: 'FT_Odds_A', key: 'FT_Odds_A', label: 'Odds fora' },
  { id: 'Modelo', key: 'Modelo', label: 'Modelo', sortable: true },
]

const filterByDate = (selectedDate) => {
  return Object.values(games).filter((item) => item.Date === selectedDate)
}

const normalizeColumns = (object_data) => {
  return object_data.map((item) => ({
    ...item,
    Modelo: modelNameToNaturalName(item.Modelo),
    FT_Odds_H: parseFloat(item.FT_Odds_H).toFixed(2),
    FT_Odds_D: parseFloat(item.FT_Odds_D).toFixed(2),
    FT_Odds_A: parseFloat(item.FT_Odds_A).toFixed(2),
  }))
}

const fetchData = async () => {
  try {
    const req = await fetch(`${apiUrl}/daily-bets`)
    const data = await req.json()
    return data
  } catch (error) {
    console.error('Erro ao buscar os dados:', error)
    return []
  }
}

const dates = ref([])
const uniqueDates = new Set()
const selectedModel = ref('Todos os modelos')

const games = await fetchData()

Object.values(games).forEach((item) => {
  uniqueDates.add(item.Date)
})
dates.value = Array.from(uniqueDates).slice(-7)
const date = ref(dates.value[dates.value?.length - 1])

const modelsOptions = computed(() => {
  const uniqueModels = new Set()
  Object.values(games)
    .filter((item) => item.Date === date.value)
    .forEach((item) => {
      uniqueModels.add(item.Modelo)
    })

  return [
    { value: null, label: 'Todos os modelos' },
    ...Array.from(uniqueModels)
      .map((item) => modelNameToNaturalName(item))
      .sort((a, b) => a.localeCompare(b)),
  ]
})

const bets = ref([])

watch(
  () => date.value,
  () => {
    selectedModel.value = 'Todos os modelos'
  },
)

const buildTableData = async (chosenDate) => {
  try {
    let filteredBets = filterByDate(chosenDate)
    if (selectedModel.value !== 'Todos os modelos') {
      filteredBets = filteredBets.filter((item) => item.Modelo === selectedModel.value)
    }
    bets.value = normalizeColumns(filteredBets)
  } catch (error) {
    console.error('Erro ao buscar apostas do dia:', error)
    bets.value = [] // Limpar a lista em caso de erro
  }
}

const qtd_games = computed(() => bets.value.length)

watchEffect(() => {
  buildTableData(date.value)
})

async function exportTableToExcel(tableData) {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Tabela')

  if (tableData.length > 0) {
    worksheet.columns = Object.keys(tableData[0]).map((key) => ({ header: key, key }))
    worksheet.addRows(tableData)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jogos_do_dia_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style></style>
