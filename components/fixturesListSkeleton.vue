<template>
	<div>
		<USkeleton class="w-[100px] h-[20px]"/>

		<div class="flex gap-3 w-full mt-3.5">
			<div class="flex flex-col gap-2 w-1/2">
				<USkeleton
					v-for="i in 7"
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
