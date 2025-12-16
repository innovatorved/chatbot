import NextAuth from "next-auth";
import { authConfig } from "@/app/(auth)/auth.config";

export const config = {
	matcher: ["/", "/:id", "/api/:path*", "/login", "/register"],
};

export default NextAuth(authConfig).auth;
