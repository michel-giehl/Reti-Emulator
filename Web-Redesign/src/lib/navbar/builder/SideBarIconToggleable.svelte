<script lang="ts">
    export let size = "0"
    export let icon: any
    export let setActive: string = "false"
    export let tooltip: string
    export let onClick: Function

    $: active = setActive == "true"

    const click = () => {
        active = !active
        onClick()
    }
</script>

<div class="navbar-icon group" on:click="{click}">
    <svelte:component this={icon} {size}/>

    <span class="navbar-tooltip group-hover:scale-100">{tooltip}</span>
</div>