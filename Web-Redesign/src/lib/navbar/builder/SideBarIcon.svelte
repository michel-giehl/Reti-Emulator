<script lang="ts">
    export let size = "0"
    export let icon: any
    export let tooltip: string

    const onClick = (e: MouseEvent) => {

    }
</script>

<div class="navbar-icon group" on:click="{onClick}">
    <svelte:component this={icon} {size}/>

    <span class="navbar-tooltip group-hover:scale-100">{tooltip}</span>
</div>
