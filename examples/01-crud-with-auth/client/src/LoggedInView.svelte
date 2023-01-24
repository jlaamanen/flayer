<script lang="ts">
  import {
    createProduct,
    getAllProducts,
    onProductsChange,
  } from "server-pkg/products";
  import { logout } from "server-pkg/user";
  import { createEventDispatcher, onMount } from "svelte";
  import ProductCard from "./ProductCard.svelte";

  export let user: { username: string; isAdmin: boolean };

  const dispatch = createEventDispatcher();

  let productsPromise = getAllProducts();

  async function handleLogout() {
    try {
      await logout();
      dispatch("logout");
    } catch (error) {
      alert(`Logout failed:\n\n${error.message}`);
    }
  }

  function reloadProducts() {
    productsPromise = getAllProducts();
  }

  async function handleNewProduct() {
    const name = prompt("New product name?");
    const price = Number(prompt("New product price?"));
    try {
      await createProduct({ name, price });
    } catch (error) {
      alert(`Creating new product failed:\n\n${error.message}`);
    }
  }

  // Start to listen to any changes to products
  onMount(() => {
    onProductsChange((products) => {
      productsPromise = Promise.resolve(products);
    });
  });
</script>

<h1>Welcome back, {user.username}!</h1>
<button class="logout" on:click={handleLogout}>Log out</button>

{#await productsPromise}
  <p>Loading...</p>
{:then products}
  {#each products as product}
    <ProductCard {product} />
  {/each}
  <button on:click={reloadProducts}>Reload products</button>
  <button on:click={handleNewProduct}>New product</button>
{/await}
