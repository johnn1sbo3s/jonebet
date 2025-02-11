<template>
	<div
		v-if="isMobile && showAlert"
		class="flex items-center justify-center h-screen w-screen bg-slate-100 font-semibold p-6"
	>
		<div class="flex flex-col items-center justify-center text-center gap-2 text-slate-700">
			<div class="text-lg font-semibold">Este site não tem navegação otimizada para dispositivos móveis.</div>

			<div class="font-normal">Se ainda assim desejar acessar, recomendamos ativar a visualização de desktop nas configurações do seu navegador.</div>

			<UButton
				size="lg"
				block
				class="mt-3"
				@click="showAlert = false"
			>
				Prosseguir
			</UButton>
		</div>

	</div>

	<div v-else class="flex h-full gap-2">
		<div class="w-1/6 h-full">
			<UVerticalNavigation
				class="fixed w-1/6 px-2 h-full pt-2 bg-slate-50 dark:bg-gray-900"
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

		<div class="w-4/5">
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
</script>

<style>
div {
	font-family: satoshi, sans-serif;
}
</style>