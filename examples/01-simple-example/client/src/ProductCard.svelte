<script lang="ts">
  import { Product, updateProduct } from "server-pkg/products";

  export let product: Product;
  let editing = false;
  let saveLoading = false;
  let productBeforeEdit: Product;

  function startEditing() {
    editing = true;
    productBeforeEdit = { ...product };
  }

  async function saveProduct() {
    saveLoading = true;
    try {
      await updateProduct(product.id, product);
      editing = false;
    } catch (error) {
      alert(`Saving product failed:\n${error.message}`);
      console.error(error);
    }
    saveLoading = false;
  }

  function cancelEditing() {
    product = productBeforeEdit;
    editing = false;
  }
</script>

<div class="card">
  {#if !editing}
    <h3>{product.name}</h3>
    <p>Price: {product.price}</p>
    <button on:click={startEditing}>Edit</button>
  {:else}
    <fieldset disabled={saveLoading}>
      <input bind:value={product.name} />
      <input type="number" bind:value={product.price} />
      <button on:click={cancelEditing}>Cancel</button>
      <button on:click={saveProduct}>Save</button>
    </fieldset>
    {#if saveLoading}
      <span>Loading...</span>
    {/if}
  {/if}
</div>

<style>
  .card {
    border: 1px solid #aaa;
    border-radius: 3px;
    margin: 0 auto;
    margin-bottom: 2rem;
    max-width: 30rem;
  }

  fieldset {
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
</style>
