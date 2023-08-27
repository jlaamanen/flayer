<script lang="ts">
    import { greet } from "server/hello";

    let name = ""
</script>

<h1>SvelteKit + Flayer example</h1>
<input placeholder="Name" bind:value={name} />
<button on:click={async () => {
  alert(await greet(name))
}}>Greet me!</button>
