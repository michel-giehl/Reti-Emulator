<script lang="ts">
    export let size: string
    export let icon: any
</script>


<div class="navbar-dropdown">
    <svelte:component this={icon} {size} class="drop-shadow-xl shadow-white"/>
    <select class="h-10 bg-transparent text-xs text-center" name="Bla">
        <slot />
    </select>
</div>