import { getSession } from "flayer";

/**
 * Guard function that checks if the user is admin
 */
export async function assertIsAdmin() {
  const session = await getSession();
  if (!session.isAdmin) {
    throw new Error("User not admin");
  }
}

/**
 * Guard function that checks if the user is logged in
 */
export async function assertIsLoggedIn() {
  const session = await getSession();
  if (!session?.username) {
    throw new Error("User not logged in");
  }
}
