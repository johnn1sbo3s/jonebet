<template>
	<div>
		<USkeleton class="w-[266px] h-[32px]"/>

		<div class="flex gap-3 w-full mt-5">
			<div class="flex flex-col gap-3 w-1/2">
				<USkeleton
					v-for="i in 5"
					:key="i"
					class="h-[90px] w-full"
				/>
			</div>

			<USkeleton class="w-1/2 h-[528px]" />
		</div>
	</div>
</template>

<script setup>

</script>

<style lang="scss" scoped>

</style>
