<template>
  <div>
    <USkeleton class="h-[20px] w-[100px]" />

    <div class="mt-3.5 flex w-full gap-3">
      <div class="flex w-1/2 flex-col gap-2">
        <USkeleton v-for="i in 7" :key="i" class="h-[90px] w-full" />
      </div>

      <USkeleton class="h-[528px] w-1/2" />
    </div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped></style>
