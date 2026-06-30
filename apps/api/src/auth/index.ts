import { admin, jwt, emailOTP } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { Pool } from "pg";
import sqlConfig from "@/config/sql.config";
import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import appConfig from "@/config/app.config";
import authConfig from "@/config/auth.config";
import cookieConfig from "@/config/cookie.config";
import { sendEmail } from "@/modules/email/utils/send-email";
import { ROLES } from "@/auth/constants/roles.constants";
import { ac, roles } from "@/auth/permissions";
import { createPolarAuthPlugin } from "@/auth/polar.plugin";
import { runPlatformMetricsTask } from "@/modules/platform-metrics/bridge/platform-metrics.bridge";

const polarAuthPlugin = createPolarAuthPlugin();

export const authOptions: BetterAuthOptions = {
    basePath: '/api/auth',
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    void runPlatformMetricsTask((service) =>
                        service.recordUserRegistered({
                            id: user.id,
                            createdAt: user.createdAt,
                        }),
                    );
                },
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            // Construct the reset URL using the frontend URL for better UX
            // BetterAuth provides the full URL, but we can customize it if needed
            const resetUrl = url.includes(appConfig.frontendUrl) 
                ? url 
                : url.replace(appConfig.baseUrl, appConfig.frontendUrl);

            // Send password reset email
            void sendEmail({
                to: user.email,
                subject: 'Reset your password',
                text: `Hello ${user.name || user.email},

You requested to reset your password. Click the link below to reset it:

${resetUrl}

If you did not request this password reset, please ignore this email. Your password will remain unchanged.

This link will expire in 1 hour.

Best regards,
The Edgewise Team`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Reset your password</h2>
                        <p>Hello ${user.name || user.email},</p>
                        <p>You requested to reset your password. Click the button below to reset it:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #007bff; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 4px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px;">
                            If you did not request this password reset, please ignore this email. 
                            Your password will remain unchanged.
                        </p>
                        <p style="color: #999; font-size: 12px;">
                            This link will expire in 1 hour.
                        </p>
                        <p style="color: #999; font-size: 12px; margin-top: 20px;">
                            Best regards,<br>
                            The Edgewise Team
                        </p>
                    </div>
                `,
            });
        },
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }, request) => {
            // Send email verification email
            void sendEmail({
                to: user.email,
                subject: 'Verify your email address',
                text: `Click the link to verify your email: ${url}\n\nIf you did not request this, please ignore this email.`,
                html: `
                    <h2>Verify your email address</h2>
                    <p>Click the link below to verify your email address:</p>
                    <p><a href="${url}">${url}</a></p>
                    <p>If you did not request this, please ignore this email.</p>
                `,
            });
        },
        sendOnSignUp: true, // Automatically send verification email on signup
        sendOnSignIn: true, // Send verification email on sign in if email is not verified
        autoSignInAfterVerification: true, // Automatically sign in user after verification
    },
    socialProviders: {
        discord: authConfig.discord,
    },
    baseURL: appConfig.baseUrl,
    secret: appConfig.secret,
    advanced: {
        crossSubDomainCookies: {
            enabled: true,
            domain: cookieConfig.domain,
        },
    },
    trustedOrigins: [
        appConfig.baseUrl,
        appConfig.frontendUrl
    ],
    plugins: [
        admin({
            ac,
            roles,
            defaultRole: ROLES.USER,
            adminRoles: [ROLES.ADMINISTRATOR],
        }),
        jwt(),
        emailOTP({
            // Override default email verification to use OTP instead of links
            overrideDefaultEmailVerification: true,
            // OTP configuration
            otpLength: 6,
            expiresIn: 300, // 5 minutes
            allowedAttempts: 3,
            // Send OTP email based on type
            async sendVerificationOTP({ email, otp, type }) {
                let subject: string;
                let text: string;
                let html: string;

                if (type === "sign-in") {
                    subject = "Sign in to your account";
                    text = `Your sign-in code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.`;
                    html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">Sign in to your account</h2>
                            <p>Your sign-in code is:</p>
                            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; 
                                        font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                                        margin: 20px 0; border-radius: 4px;">
                                ${otp}
                            </div>
                            <p>This code will expire in 5 minutes.</p>
                            <p style="color: #999; font-size: 12px;">
                                If you did not request this, please ignore this email.
                            </p>
                        </div>
                    `;
                } else if (type === "email-verification") {
                    subject = "Verify your email address";
                    text = `Your email verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.`;
                    html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">Verify your email address</h2>
                            <p>Your email verification code is:</p>
                            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; 
                                        font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                                        margin: 20px 0; border-radius: 4px;">
                                ${otp}
                            </div>
                            <p>This code will expire in 5 minutes.</p>
                            <p style="color: #999; font-size: 12px;">
                                If you did not request this, please ignore this email.
                            </p>
                        </div>
                    `;
                } else {
                    // type === "forget-password"
                    subject = "Reset your password";
                    text = `Your password reset code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this password reset, please ignore this email. Your password will remain unchanged.`;
                    html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">Reset your password</h2>
                            <p>Your password reset code is:</p>
                            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; 
                                        font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                                        margin: 20px 0; border-radius: 4px;">
                                ${otp}
                            </div>
                            <p>This code will expire in 5 minutes.</p>
                            <p style="color: #999; font-size: 12px;">
                                If you did not request this password reset, please ignore this email. 
                                Your password will remain unchanged.
                            </p>
                        </div>
                    `;
                }

                // Send the OTP email (don't await to prevent timing attacks)
                void sendEmail({
                    to: email,
                    subject,
                    text,
                    html,
                });
            },
        }),
        oauthProvider({
            loginPage: "/sign-in",
            consentPage: "/consent",
            allowDynamicClientRegistration: true,
        }),
        ...(polarAuthPlugin ? [polarAuthPlugin] : []),
    ],
} as any;

export const auth = betterAuth({
    database: new Pool(sqlConfig),
    ...authOptions,
});
