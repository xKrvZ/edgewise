import { checkout, polar, portal, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import appConfig from '@/config/app.config';
import billingConfig from '@/config/billing.config';
import { createPolarWebhookHandlers } from '@/modules/platform-metrics/handlers/polar-webhook.handlers';

export function isPolarBillingEnabled(): boolean {
  return billingConfig.provider === 'polar';
}

export function createPolarClient(): Polar | null {
  if (!isPolarBillingEnabled()) {
    return null;
  }

  return new Polar({
    accessToken: billingConfig.polar.accessToken,
    server: billingConfig.polar.server,
  });
}

export function createPolarAuthPlugin() {
  const polarClient = createPolarClient();
  if (!polarClient) {
    return null;
  }

  return polar({
    client: polarClient,
    createCustomerOnSignUp: true,
    use: [
      checkout({
        // Product slug must match checkout calls (authClient.checkout({ slug: 'pro' })).
        // Attach benefits to this product in Polar — metadata slugs must match
        // featureToPolarSlug values (journal defaults to checkout slug `pro`).
        products: billingConfig.polar.productId
          ? [
              {
                productId: billingConfig.polar.productId,
                slug: billingConfig.polar.checkoutSlug,
              },
            ]
          : [],
        successUrl: `${appConfig.frontendUrl}/account?checkout=success`,
        returnUrl: `${appConfig.frontendUrl}/account#billing`,
        authenticatedUsersOnly: true,
      }),
      portal({
        returnUrl: `${appConfig.frontendUrl}/account#billing`,
      }),
      ...(billingConfig.polar.webhookSecret
        ? [
            webhooks({
              secret: billingConfig.polar.webhookSecret,
              ...createPolarWebhookHandlers(),
            }),
          ]
        : []),
    ],
  });
}
