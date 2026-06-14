<template>
  <div class="flex flex-col gap-3">
    <div class="grid w-full grid-cols-10 gap-3">
      <div class="col-span-3 flex flex-col gap-3">
        <USkeleton v-for="i in 2" :key="`metric-${i}`" class="h-72 w-full rounded-2xl" />
      </div>

      <USkeleton class="col-span-7 h-full w-full rounded-2xl" />
    </div>

    <USkeleton class="h-100 w-full rounded-2xl" />

    <div class="grid grid-cols-2 gap-3">
      <USkeleton v-for="i in 2" :key="`result-${i}`" class="h-80 w-full rounded-2xl" />
    </div>

    <USkeleton class="h-96 w-full rounded-2xl" />
  </div>
</template>

<script setup></script>
