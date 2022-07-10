<script lang="ts">
  import { getAllProducts } from "server-pkg/products";

  let productsPromise = null;

  function fetchProducts() {
    productsPromise = getAllProducts();
  }
</script>

<main>
  {#if !productsPromise}
    <button on:click={fetchProducts}>Load products</button>
  {:else}
    {#await productsPromise}
      <p>Loading products...</p>
    {:then products}
      <pre>{JSON.stringify(products, null, 2)}</pre>
      <button on:click={fetchProducts}>Reload products</button>
    {:catch error}
      <p>Error: {error.message}</p>
    {/await}
  {/if}
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  p {
    max-width: 14rem;
    margin: 1rem auto;
    line-height: 1.35;
  }

  @media (min-width: 480px) {
    p {
      max-width: none;
    }
  }
</style>
