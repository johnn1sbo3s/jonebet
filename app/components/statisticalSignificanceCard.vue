<template>
  <UCard id="statistical-significance" class="border border-zinc-800 bg-zinc-900">
    <template #header>
      <p class="font-semibold">Significância Estatística</p>
    </template>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div v-for="m in metrics" :key="m.label">
        <div class="flex items-center gap-1">
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">{{ m.label }}</p>

          <UButton
            v-if="m.key"
            variant="ghost"
            size="xs"
            icon="i-lucide-info"
            color="neutral"
            :aria-label="`O que é ${m.label}?`"
            class="-mt-0.5 cursor-pointer p-0 text-zinc-700 hover:text-zinc-400"
            @click="infoOpen[m.key] = true"
          />
        </div>

        <p class="mt-1 text-base font-semibold" :class="m.class">{{ m.value }}</p>
      </div>
    </div>

    <UModal v-for="m in infoMetrics" :key="m.label" v-model:open="infoOpen[m.key]" :title="m.label">
      <template #body>
        <p class="text-sm leading-relaxed text-zinc-300">{{ m.text }}</p>
      </template>
    </UModal>
  </UCard>
</template>

<script setup>
const props = defineProps({
  stats: {
    type: Object,
    default: null,
  },
})

const LABELS = {
  roiTStatistic: 'T-statistic ROI',
  roiPValue: 'p-value ROI',
  roiConfidenceInterval: 'IC 95% ROI',
  positiveEdgeProbability: 'Prob. edge positivo',
  wrTStatistic: 'T-statistic WR',
  wrPValue: 'p-value WR',
  kellyCriterion: 'Kelly Criterion',
  minimumSampleSize: 'Amostra mínima',
}

const INFO_TEXT = {
  roiTStatistic:
    'Mede quantos desvios padrão o ROI observado está de zero. Valores absolutos maiores que 2 indicam significância estatística.',
  roiPValue:
    'Probabilidade de observar esse ROI se o modelo não tivesse edge de verdade. Valores abaixo de 0.05 (5%) indicam que o ROI é significativamente diferente de zero.',
  roiConfidenceInterval:
    'Intervalo de 95% de confiança para o ROI real do modelo. Se o intervalo não incluir zero, o edge é estatisticamente robusto.',
  positiveEdgeProbability:
    'Chance de o modelo ter edge lucrativo de verdade. Acima de 80% é verde; abaixo de 50% é vermelho.',
  wrTStatistic:
    'Testa se a taxa de acerto é maior que o breakeven implícito na odd média. Valores absolutos maiores que 2 indicam significância.',
  wrPValue:
    'Probabilidade de a taxa de acerto observada ocorrer por acaso se o modelo apenas quebrasse a paridade das odds.',
  kellyCriterion:
    'Fração ótima da banca a alocar em cada aposta do modelo, segundo o critério de Kelly. Valores negativos indicam que não se deve seguir o modelo.',
  minimumSampleSize:
    'Número mínimo de apostas necessário para detectar o ROI observado com 95% de confiança e 80% de poder estatístico.',
}

const infoOpen = reactive({
  roiTStatistic: false,
  roiPValue: false,
  roiConfidenceInterval: false,
  positiveEdgeProbability: false,
  wrTStatistic: false,
  wrPValue: false,
  kellyCriterion: false,
  minimumSampleSize: false,
})

const infoMetrics = computed(() =>
  Object.entries(INFO_TEXT).map(([key, text]) => ({
    label: LABELS[key],
    text,
    key,
  })),
)

const s = computed(() => props.stats || {})

const metrics = computed(() => [
  {
    label: LABELS.roiTStatistic,
    value: formatNumber(s.value.roiTStatistic),
    class: Math.abs(s.value.roiTStatistic || 0) > 2 ? 'text-teal-400' : 'text-red-400',
    key: 'roiTStatistic',
  },
  {
    label: LABELS.roiPValue,
    value: formatNumber(s.value.roiPValue, 3),
    class: (s.value.roiPValue || 1) < 0.05 ? 'text-teal-400' : 'text-red-400',
    key: 'roiPValue',
  },
  {
    label: LABELS.roiConfidenceInterval,
    value: `${formatPercent(s.value.roiConfidenceInterval?.[0])} → ${formatPercent(s.value.roiConfidenceInterval?.[1])}`,
    class: icClass(s.value.roiConfidenceInterval),
    key: 'roiConfidenceInterval',
  },
  {
    label: LABELS.positiveEdgeProbability,
    value: formatPercent(s.value.positiveEdgeProbability, 1),
    class: edgeProbClass(s.value.positiveEdgeProbability),
    key: 'positiveEdgeProbability',
  },
  {
    label: LABELS.wrTStatistic,
    value: formatNumber(s.value.wrTStatistic),
    class: Math.abs(s.value.wrTStatistic || 0) > 2 ? 'text-teal-400' : 'text-red-400',
    key: 'wrTStatistic',
  },
  {
    label: LABELS.wrPValue,
    value: formatNumber(s.value.wrPValue, 3),
    class: (s.value.wrPValue || 1) < 0.05 ? 'text-teal-400' : 'text-red-400',
    key: 'wrPValue',
  },
  {
    label: LABELS.kellyCriterion,
    value: formatPercent(s.value.kellyCriterion, 2),
    class: (s.value.kellyCriterion || 0) > 0 ? 'text-teal-400' : 'text-red-400',
    key: 'kellyCriterion',
  },
  {
    label: LABELS.minimumSampleSize,
    value: sampleSizeValue(s.value.minimumSampleSize, s.value.sampleSizeRemaining),
    class: (s.value.sampleSizeRemaining || 0) === 0 ? 'text-teal-400' : 'text-red-400',
    key: 'minimumSampleSize',
  },
])

function icClass(interval) {
  if (!interval || interval.length !== 2) return 'text-white'
  const [lower, upper] = interval
  if (lower > 0) return 'text-teal-400'
  if (upper < 0) return 'text-red-400'
  return 'text-white'
}

function edgeProbClass(v) {
  if (v == null) return 'text-white'
  if (v > 80) return 'text-teal-400'
  if (v < 50) return 'text-red-400'
  return 'text-white'
}

function sampleSizeValue(min, remaining) {
  if (min == null) return '—'
  const base = formatNumber(min, 0)
  if (remaining == null || remaining === 0) return base
  return `${base} (${formatNumber(remaining, 0)} faltam)`
}
</script>
