<script lang="ts">
	import { onMount } from 'svelte';
	import Brightness7 from 'svelte-material-icons/Brightness7.svelte';
	import Brightness3 from 'svelte-material-icons/Brightness3.svelte';
	import SideBarIconToggleable from '$lib/navbar/builder/SideBarIconToggleable.svelte';

	export let size: string;

	// Code from
	// https://dev.to/lenaschnedlitz/create-a-simple-dark-mode-toggle-with-svelte-4b3g

	$: preferredTheme = 'undefined';
	$: currentTheme = 'undefined';
	const STORAGE_KEY = 'theme';
	const DARK_PREFERENCE = '(prefers-color-scheme: dark)';

	const THEMES = {
		DARK: 'dark',
		LIGHT: 'light'
	};

	// check OS preference
	const prefersDarkThemes = () => window.matchMedia(DARK_PREFERENCE).matches;

	onMount(() => {
		preferredTheme = prefersDarkThemes() ? THEMES.DARK : THEMES.LIGHT;
		applyTheme();
		window.matchMedia(DARK_PREFERENCE).addEventListener('change', applyTheme);
	});

	const toggleTheme = () => {
		const stored = localStorage.getItem(STORAGE_KEY);

		if (stored) {
			// clear storage
			localStorage.removeItem(STORAGE_KEY);
		} else {
			// store opposite of preference
			localStorage.setItem(STORAGE_KEY, prefersDarkThemes() ? THEMES.LIGHT : THEMES.DARK);
		}
		applyTheme();
	};

	const applyTheme = () => {
		currentTheme = localStorage.getItem(STORAGE_KEY) ?? preferredTheme;
		if (currentTheme === THEMES.DARK) {
			document.body.classList.add(THEMES.DARK);
		} else {
			document.body.classList.remove(THEMES.DARK);
		}
	};
</script>

{#if currentTheme === 'undefined'}
	<SideBarIconToggleable
		size="32"
		icon={Brightness7}
		tooltip="🔥 Toggle dark mode"
		onClick={toggleTheme}
	/>
{:else if currentTheme === 'dark'}
	<SideBarIconToggleable
		size="32"
		icon={Brightness7}
		tooltip="🔥 Disable dark mode"
		onClick={toggleTheme}
		setActive="false"
	/>
{:else}
	<SideBarIconToggleable
		size="32"
		icon={Brightness3}
		tooltip="🔥 Enable dark mode"
		onClick={toggleTheme}
		setActive="false"
	/>
{/if}
