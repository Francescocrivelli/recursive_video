import {Session, NextAuth} from "next-auth";

declare module "next-auth" {
  interface User {
    id: string; // Firebase Auth UID or another unique identifier
    email: string;
    role: string; // Example roles: "admin", "editor", "viewer"
    name?: string; // Optional name attribute
  }

  // interface Session {
  //   user: {
  //     id: string;
  //     email: string;
  //     role: string;
  //     name?: string;
  //   };
  // }
}

declare module "next-auth/jwt" {
    interface JWT {
      role?: string; // Add your custom role property
    }
  }
