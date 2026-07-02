<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="Academia" description="Aprenda os termos da plataforma" />

    <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Buscar termo..." size="lg" class="w-full" />

    <DataErrorCard v-if="!terms.length" icon="i-lucide-info" message="Glossário vazio por enquanto" />

    <template v-else>
      <template v-for="cat in visibleCategories" :key="cat">
        <div>
          <h2 class="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            {{ cat }} ({{ filteredByCategory[cat]?.length || 0 }})
          </h2>

          <div class="grid grid-cols-1 items-start gap-3 md:grid-cols-2 lg:grid-cols-3">
            <AcademyTermCard v-for="term in filteredByCategory[cat]" :key="term.name" :term="term" />
          </div>
        </div>
      </template>

      <p v-if="searchQuery && visibleCategories.length === 0" class="text-sm text-zinc-500">
        Nenhum termo encontrado pra "{{ searchQuery }}"
      </p>
    </template>
  </div>
</template>

<script setup>
const { terms, search } = useAcademiaGlossario()

const searchQuery = ref('')

const CATEGORY_ORDER = ['Conceito', 'Estratégia', 'Modelo']

const filtered = computed(() => search(searchQuery.value))

const filteredByCategory = computed(() => _groupBy(filtered.value, 'category'))

const visibleCategories = computed(() => CATEGORY_ORDER.filter((cat) => filteredByCategory.value[cat]?.length > 0))
</script>
