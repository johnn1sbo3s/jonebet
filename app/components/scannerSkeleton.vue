<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1.5">
      <USkeleton class="h-3 w-12" />

      <div class="flex w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <USkeleton class="h-9 w-full rounded-lg md:w-72" />

        <USkeleton class="h-8 w-full rounded-lg md:w-90" />

        <div class="flex items-center justify-end gap-2">
          <USkeleton class="h-6 w-10 rounded-full" />

          <USkeleton class="h-4 w-24" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <USkeleton v-for="i in 6" :key="i" class="h-130 rounded-2xl" />
    </div>
  </div>
</template>

<script setup></script>
