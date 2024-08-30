<template>
  <div class="flex flex-col gap-4">
    <page-header title="Comparação de modelos"></page-header>
    <USelectMenu
      class="w-1/5"
      searchable
      searchable-placeholder="Pesquise por categoria"
      placeholder="Selecione uma categoria"
      :options="categoriesList"
      v-model:model-value="chosenCategory"
    />
    <div class="h-96 w-full">
      <div>
        <p v-if="performanceDataRows.length > 0" class="mb-3 text-sm">
          {{ performanceDataRows.length }} modelos
        </p>
        <UTable
          :ui="{
            wrapper:
              'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg',
          }"
          :rows="performanceDataRows"
          :columns="performanceDataColumns"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const chosenCategory = ref("Todos os modelos");
const performanceDataRows = ref([]);

const store = usePerformanceStore();

const runtimeConfig = useRuntimeConfig();
const apiUrl = runtimeConfig.public.API_URL;

const performanceData = ref({});

const categoriesList = [
  "Todos os modelos",
  "Betfair",
  "Lay Away",
  "LTD",
  "Lay_Home",
  "Lay Zebra",
  "Back Home",
  "Back Away",
  "Over 25",
  "Over 05HT",
  "Back Draw",
  "Lay Goleada",
  "Lay 0x2",
  "Lay 2x0",
];

const performanceDataColumns = ref([
  { key: "modelo", label: "Modelo" },
  { key: "media", label: "Média P/L", sortable: true },
  { key: "desvpad", label: "Desvpad P/L", sortable: true },
  { key: "ev_val", label: "EV Val", sortable: true },
  { key: "ev_real", label: "EV Real", sortable: true },
  { key: "bottom_int", label: "Int. conf. inferior", sortable: true },
  { key: "top_int", label: "Int. conf. superior", sortable: true },
  { key: "med_atual", label: "Média atual" },
  { key: "desvpad_atual", label: "Desvpad atual" },
  { key: "n_games", label: "Jogos" },
]);

const modelNameToBack = (modelName) => {
  return modelName.toLowerCase().replace(/\s+/g, "_");
};

const modelNameToFront = (modelName) => {
  return modelName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

function buildTableObject(objectList) {
  let objects = [];
  objectList.forEach((item) => {
    let myObj = {
      modelo: modelNameToFront(item.modelo),
      media: item.total.media.toFixed(2),
      desvpad: item.total.desvpad.toFixed(2),
      ev_val: item.val.ev.toFixed(2),
      ev_real: item.real.ev.toFixed(2),
      med_dp: item.total.med_dp.toFixed(2),
      bottom_int: item.total.intervalo_confianca[0].toFixed(2),
      top_int: item.total.intervalo_confianca[1].toFixed(2),
      med_atual: item.total.media_atual.toFixed(2),
      desvpad_atual: item.total.desvpad_atual.toFixed(2),
      n_games: item.total.qtd_jgs_atual,
    };
    objects.push(myObj);
  });
  return objects;
}

if (_isEmpty(store.getPerformanceData)) {
	const { data } = await useFetch(`${apiUrl}/model-performance`);
	store.setPerformanceData(data.value);
}
performanceData.value = store.getPerformanceData;

const buildComparisonTable = () => {
  performanceDataRows.value = [];

  if (chosenCategory.value === "Todos os modelos") {
    performanceDataRows.value = buildTableObject(performanceData.value);
    return;
  }

  let filteredModels = [];
  _forEach(performanceData.value, function (value, key) {
    if (value.modelo.includes(modelNameToBack(chosenCategory.value))) {
      filteredModels.push(value);
    }
  });
  performanceDataRows.value = buildTableObject(filteredModels);
};

watchEffect(() => {
  buildComparisonTable();
});
</script>

<style>
</style>