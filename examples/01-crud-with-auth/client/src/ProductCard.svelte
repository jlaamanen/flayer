<script lang="ts">
  import { deleteProduct, Product, updateProduct } from "server-pkg/products";

  export let product: Product;
  let editing = false;
  let loading = false;
  let productBeforeEdit: Product;

  function handleEdit() {
    editing = true;
    productBeforeEdit = { ...product };
  }

  function cancelEditing() {
    product = productBeforeEdit;
    editing = false;
  }

  async function handleSave() {
    loading = true;
    try {
      await updateProduct(product.id, product);
      editing = false;
    } catch (error) {
      alert(`Saving product failed:\n\n${error.message}`);
      console.error(error);
    }
    loading = false;
  }

  async function handleDelete() {
    if (!confirm(`Do you really want to delete product "${product.name}"?`)) {
      return;
    }
    loading = true;
    try {
      await deleteProduct(product.id);
    } catch (error) {
      alert(`Deleting product failed:\n\n${error.message}`);
      console.error(error);
    }
    loading = false;
  }
</script>

<div class="card">
  {#if !editing}
    <h3>{product.name}</h3>
    <p>Price: {product.price}</p>
    <div>
      <button on:click={handleEdit} disabled={loading}>Edit</button>
      <button on:click={handleDelete} disabled={loading}>Delete</button>
    </div>
  {:else}
    <h3>{product.name}</h3>
    <form on:submit|preventDefault={handleSave}>
      <fieldset disabled={loading}>
        <input name="name" bind:value={product.name} />
        <input name="price" type="number" bind:value={product.price} />
        <div>
          <button type="button" on:click={cancelEditing}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </fieldset>
    </form>
  {/if}
  {#if loading}
    <span>Loading...</span>
  {/if}
</div>

<style>
  .card {
    border: 1px solid #aaa;
    border-radius: 3px;
    margin: 1rem auto;
    /* margin-bottom: 2rem; */
    max-width: 30rem;
    padding-bottom: 1rem;
  }

  fieldset {
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
</style>
