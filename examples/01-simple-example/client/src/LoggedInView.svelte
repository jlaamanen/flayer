<script lang="ts">
  import { getAllProducts, onProductsChange } from "server-pkg/products";
  import { logout } from "server-pkg/user";
  import { createEventDispatcher, onMount } from "svelte";
  import ProductCard from "./ProductCard.svelte";

  export let user: { username: string; isAdmin: boolean };

  const dispatch = createEventDispatcher();

  let productsPromise = getAllProducts();

  function reloadProducts() {
    productsPromise = getAllProducts();
  }

  async function handleLogout() {
    await logout();
    dispatch("logout");
  }

  // Start to listen to any changes to products
  onMount(() => {
    onProductsChange((products) => {
      productsPromise = Promise.resolve(products);
    });
  });
</script>

<h1>Welcome back, {user.username}!</h1>

{#await productsPromise}
  <p>Loading...</p>
{:then products}
  {#each products as product}
    <ProductCard {product} />
  {/each}
  <button on:click={reloadProducts}>Reload products</button>
{/await}

<button class="logout" on:click={handleLogout}>Log out</button>
