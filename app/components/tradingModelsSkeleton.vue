<template>
  <div class="grid grid-cols-1 gap-3">
    <USkeleton v-for="i in 5" :key="`day-${i}`" class="h-32 w-full rounded-2xl" />

    <USkeleton v-for="i in 2" :key="`agg-${i}`" class="h-64 w-full rounded-2xl" />
  </div>
</template>
