import "flayer";

// Override the session type
declare module "flayer" {
  export interface Session {
    username: string;
    isAdmin: boolean;
  }
}
