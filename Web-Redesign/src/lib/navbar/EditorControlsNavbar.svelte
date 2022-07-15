<script lang="ts">
    import Navbar from "$lib/navbar/builder/Navbar.svelte"
    import SideBarIcon from "$lib/navbar/builder/SideBarIcon.svelte"
    import Dropdown from "$lib/navbar/builder/Dropdown.svelte"
    import SideBarIconToggleable from "$lib/navbar/builder/SideBarIconToggleable.svelte"
    import RightAlign from "./builder/RightAlign.svelte"

    import Play from "svelte-material-icons/Play.svelte"
    import ContentSaveOutline from "svelte-material-icons/ContentSaveOutline.svelte"
    import TrayArrowUp from "svelte-material-icons/TrayArrowUp.svelte"
    import FormatColorText from "svelte-material-icons/FormatColorText.svelte"
    import Vimeo from "svelte-material-icons/Vimeo.svelte"
    import DesktopClassic from "svelte-material-icons/DesktopClassic.svelte"
    import Xml from "svelte-material-icons/Xml.svelte"

    import DarkModeToggle from "$lib/DarkModeToggle.svelte"

    export let size: string
    export let themes: Array<string>
</script>


<div class="navbar bg-base-100">
	<div class="flex-2">
		<button class="btn btn-square btn-ghost">
			<svelte:component this={Play} size={32} class="inline-block w-5 h-5 stroke-current" />
		</button>
	</div>
	<div class="flex-2 ml-2">
		<button class="btn btn-square btn-ghost">
			<svelte:component this={ContentSaveOutline} size={32} class="inline-block w-5 h-5 stroke-current" />
		</button>
	</div>
	<div class="flex-2 ml-2">
		<button class="btn btn-square btn-ghost">
			<svelte:component this={TrayArrowUp} size={32} class="inline-block w-5 h-5 stroke-current" />
		</button>
	</div>
    <div class="flex-2 ml-2">
		<button class="btn btn-square btn-ghost">
			<svelte:component this={FormatColorText} size={32} class="inline-block w-5 h-5 stroke-current" />
		</button>
	</div>
    <div class="flex-1 ml-2">
		<button class="btn btn-square btn-ghost">
			<svelte:component this={DesktopClassic} size={32} class="inline-block w-5 h-5 stroke-current" />
		</button>
	</div>

	<div class="flex-none ml-2">
		<select data-choose-theme class="select select-bordered w-full max-w-xs">
			<option selected disabled>Theme</option>
			<option>light</option>
			<option>dark</option>
			<option>corporate</option>
			<option>synthwave</option>
			<option>retro</option>
			<option>cyberpunk</option>
			<option>valentine</option>
			<option>halloween</option>
			<option>forest</option>
			<option>aqua</option>
			<option>lofi</option>
			<option>black</option>
			<option>luxury</option>
			<option>dracula</option>
			<option>business</option>
			<option>night</option>
			<option>coffee</option>
			</select>
	</div>
    <div class="flex-none ml-2">
		<select data-choose-theme class="select select-bordered w-full max-w-xs">
			<option>Einfache ReTi</option>
			<option>Erweirterte ReTi</option>
			</select>
	</div>
	<div class="flex-none ml-2">
		<select data-choose-theme class="select select-bordered w-full max-w-xs">
			<option selected>ReTi Assembler</option>
			<option>Pico-C</option>
			<option>UART</option>
			</select>
	</div>
</div>