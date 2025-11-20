import { auth } from "./src/lib/auth";

export default auth;

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/battle/:path*",
        "/pvp/:path*",
    ],
    runtime: "nodejs",
};
