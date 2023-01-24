<script lang="ts">
  import { getUsers } from "server-pkg/user";
</script>

{#await getUsers() then users}
  <p>Psst... Here are some credentials to try out:</p>
  <table>
    <thead>
      <tr>
        <td>Username</td>
        <td>Password</td>
        <td>Is admin?</td>
      </tr>
    </thead>
    <tbody>
      {#each users as user}
        <tr>
          <td>{user.username}</td>
          <td>{user.password}</td>
          <td>{user.isAdmin ? "Yes!" : "Nope..."}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/await}

<style>
  table {
    margin: 0 auto;
  }
  thead {
    font-weight: bold;
  }
</style>
