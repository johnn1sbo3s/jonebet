<template>
  <div>
    <USkeleton class="mb-4 h-5 w-25" />

    <div class="flex gap-3">
      <div class="flex w-full flex-col gap-2 sm:w-1/2">
        <USkeleton v-for="i in 7" :key="i" class="h-22.5 w-full rounded-2xl" />
      </div>

      <USkeleton class="hidden h-132 w-1/2 rounded-2xl sm:block" />
    </div>
  </div>
</template>

<script setup></script>
