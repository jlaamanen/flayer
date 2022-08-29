import { getSession } from "flayer";

// Override the session type
declare global {
  namespace Flayer {
    interface Session {
      username: string;
      isAdmin: boolean;
    }
  }
}
/**
 * Guard function that checks if the user is admin
 */
export function assertIsAdmin() {
  const session = getSession();
  if (!session.isAdmin) {
    throw new Error("User not admin");
  }
}

/**
 * Guard function that checks if the user is logged in
 */
export function assertIsLoggedIn() {
  const session = getSession();
  if (!session?.username) {
    throw new Error("User not logged in");
  }
}
