import { destroySession, getSession, setSession } from "flayer";

interface User {
  username: string;
  password: string;
  isAdmin: boolean;
}

// Some fixed test users, don't try this at home!
const users: User[] = [
  {
    username: "admin",
    password: "ihavethepower",
    isAdmin: true,
  },
  {
    username: "normie",
    password: "password",
    isAdmin: false,
  },
];

/**
 * Double whoops - seems like we've exposed all our users and credentials!
 * Oh well, at least this makes testing a bit easier
 * @returns All users
 */
export function getUsers() {
  return users;
}

/**
 * Try to authenticate the user with given credentials.
 * @param username Username
 * @param password Password
 */
export function authenticate(username: string, password: string) {
  const user = users.find(
    (user) => user.username === username && user.password === password
  );
  if (!user) {
    throw new Error("Username or password incorrect");
  }
  // Credentials OK, set user data to session
  setSession({
    username: user.username,
    isAdmin: user.isAdmin,
  });
}

/**
 * Get the currently logged in user info (username & is admin)
 * @returns Currently logged in user
 */
export async function getLoggedInUser() {
  const session = await getSession();
  return !session
    ? null
    : {
        username: session.username,
        isAdmin: session.isAdmin,
      };
}

/**
 * Logout the user.
 */
export function logout() {
  destroySession();
}
