<template>
	<div class="h-full sm:flex gap-2">
		<div
			v-if="showMenu"
			class="w-full h-full z-50"
		>
			<UVerticalNavigation
				class="h-full w-full pt-2 bg-slate-50 dark:bg-gray-900"
				:links="links"
				:ui="{
					padding: 'p-4',
					gap: 'gap-2',
					avatar: 'w-5 h-5',
				}"
			>
				<template #avatar> </template>
			</UVerticalNavigation>
		</div>

		<div class="hidden sm:block w-full sm:w-1/6 h-full">
			<UVerticalNavigation
				class="fixed px-2 h-full pt-2 bg-slate-50 dark:bg-gray-900"
				:links="links"
				:ui="{
					padding: 'p-4',
					gap: 'gap-2',
					avatar: 'w-5 h-5',
				}"
			>
				<template #avatar> </template>
			</UVerticalNavigation>
		</div>

		<div class="w-full sm:w-4/5">
			<NuxtLoadingIndicator color="linear-gradient(to right, #25D88B, #1E9EF4)"/>
			<NuxtPage class="p-6" />
		</div>
	</div>
</template>

<script setup>
import { init } from '@fullstory/browser';
const { isMobile } = useDevice();
const showAlert = ref(true);

if (process.client) {
  init({ orgId: 'o-22P180-na1' });
}

useHead({
	title: "DataPlay",
})

const menuState = useMenuStore();

const links = [
	[
		{
			avatar: {
				src: "/dataplay-icon.png",
				srcset: "",
				alt: "",
			},
			label: "DataPlay",
			to: "https://github.com/johnn1sbo3s",
			target: "_blank",
		},
	],
	[
		{
			label: "Dashboard",
			icon: "i-heroicons-squares-2x2",
			to: "/",
		},
		{
			label: "Jogos do Dia",
			icon: "i-heroicons-calendar-days",
			to: "/fixtures",
		},
		{
			label: "Apostas do Dia",
			icon: "i-heroicons-clipboard-document-list",
			to: "/daily-bets",
		},
		{
			label: "Performance dos modelos",
			icon: "i-heroicons-chart-bar",
			to: "/performance",
		},
		{
			label: "Monitoramento em Lotes",
			icon: "i-heroicons-inbox-stack",
			to: "/batch-monitoring",
		},
		{
			label: "Alavancagem",
			icon: "i-heroicons-arrow-trending-up",
			to: "/leverage-bets",
		},
		{
			label: "Comparador",
			icon: "i-heroicons-chart-pie",
			to: "/comparison",
		},
	],
];

const showMenu = computed(() => menuState.getMenuState);

</script>

<style>
div {
	font-family: satoshi, sans-serif;
}
</style>