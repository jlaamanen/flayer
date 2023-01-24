/**
 * Double whoops - seems like we've exposed all our users and credentials!
 * Oh well, at least this makes testing a bit easier
 * @returns All users
 */
export function getUsers(): Promise<User[]>;
/**
 * Try to authenticate the user with given credentials.
 * @param username Username
 * @param password Password
 */
export function authenticate(username: string, password: string): Promise<void>;
/**
 * Get the currently logged in user info (username & is admin)
 * @returns Currently logged in user
 */
export function getLoggedInUser(): Promise<{ username: string; isAdmin: boolean; }>;
/**
 * Logout the user.
 */
export function logout(): Promise<void>;

interface User {
    username: string;
    password: string;
    isAdmin: boolean;
}
