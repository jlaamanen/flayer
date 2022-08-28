<script lang="ts">
  import { getAllProducts } from "server-pkg/products";

  import { logout } from "server-pkg/user";
  import { createEventDispatcher } from "svelte";
  import ProductCard from "./ProductCard.svelte";

  export let user: {username: string; isAdmin: boolean};

  const dispatch = createEventDispatcher();

  let productsPromise = getAllProducts();

  function reloadProducts() {
    productsPromise = getAllProducts();
  }

  async function handleLogout() {
    await logout();
    dispatch("logout");
  }
</script>

<h1>Welcome back, {user.username}!</h1>

{#await productsPromise then products}
    {#each products as product}
      <ProductCard {product} />
    {/each}
{/await}

<button class="logout" on:click={handleLogout}>Log out</button>
