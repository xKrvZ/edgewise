import { jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { Pool } from "pg";
import sqlConfig from "./config/sql.config";
import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import appConfig from "./config/app.config";
import authConfig from "./config/auth.config";

export const authOptions: BetterAuthOptions = {
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        discord: authConfig.discord,
    },
    baseURL: appConfig.baseUrl,
    secret: appConfig.secret,
    trustedOrigins: [
        appConfig.baseUrl,
        appConfig.frontendUrl
    ],
    plugins: [
        jwt(),
        oauthProvider({
            loginPage: "/sign-in",
            consentPage: "/consent",
            allowDynamicClientRegistration: true,
        }),
    ],
} as any;

export const auth = betterAuth({
    database: new Pool(sqlConfig),
    ...authOptions,
});
