function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return null;
}

function readDate(record: Record<string, unknown>, ...keys: string[]): Date | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || value instanceof Date) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return null;
}

function readAmountCents(record: Record<string, unknown>): number {
  const candidates = [
    record.amount,
    record.totalAmount,
    record.total_amount,
    record.netAmount,
    record.net_amount,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.round(candidate);
    }
  }

  return 0;
}

export function extractPolarPayloadData(payload: unknown): Record<string, unknown> | null {
  const root = readRecord(payload);
  if (!root) {
    return null;
  }

  return readRecord(root.data) ?? root;
}

export function extractPolarUserId(payload: unknown): string | null {
  const data = extractPolarPayloadData(payload);
  if (!data) {
    return null;
  }

  const customer = readRecord(data.customer);
  if (customer) {
    const externalId = readString(customer, 'externalId', 'external_id');
    if (externalId) {
      return externalId;
    }
  }

  return readString(data, 'externalCustomerId', 'external_customer_id');
}

export function extractPolarCustomerId(payload: unknown): string | null {
  const data = extractPolarPayloadData(payload);
  if (!data) {
    return null;
  }

  const customer = readRecord(data.customer);
  if (customer) {
    const customerId = readString(customer, 'id');
    if (customerId) {
      return customerId;
    }
  }

  return readString(data, 'customerId', 'customer_id');
}

export function extractPolarSubscriptionId(payload: unknown): string | null {
  const data = extractPolarPayloadData(payload);
  if (!data) {
    return null;
  }

  return readString(data, 'id', 'subscriptionId', 'subscription_id');
}

export function extractPolarProductId(payload: unknown): string | null {
  const data = extractPolarPayloadData(payload);
  if (!data) {
    return null;
  }

  const product = readRecord(data.product);
  if (product) {
    const productId = readString(product, 'id');
    if (productId) {
      return productId;
    }
  }

  return readString(data, 'productId', 'product_id');
}

export function extractPolarSubscriptionStatus(payload: unknown): string | null {
  const data = extractPolarPayloadData(payload);
  if (!data) {
    return null;
  }

  return readString(data, 'status');
}

export function extractPolarPeriodEnd(payload: unknown): Date | null {
  const data = extractPolarPayloadData(payload);
  if (!data) {
    return null;
  }

  return readDate(data, 'currentPeriodEnd', 'current_period_end');
}

export function extractPolarOrderId(payload: unknown): string | null {
  const data = extractPolarPayloadData(payload);
  if (!data) {
    return null;
  }

  return readString(data, 'id', 'orderId', 'order_id');
}

export function extractPolarOrderAmountCents(payload: unknown): number {
  const data = extractPolarPayloadData(payload);
  if (!data) {
    return 0;
  }

  return readAmountCents(data);
}

export function extractPolarOccurredAt(payload: unknown): Date {
  const data = extractPolarPayloadData(payload);
  if (data) {
    const occurredAt = readDate(
      data,
      'createdAt',
      'created_at',
      'paidAt',
      'paid_at',
      'modifiedAt',
      'modified_at',
    );
    if (occurredAt) {
      return occurredAt;
    }
  }

  const root = readRecord(payload);
  if (root) {
    const occurredAt = readDate(root, 'timestamp', 'createdAt', 'created_at');
    if (occurredAt) {
      return occurredAt;
    }
  }

  return new Date();
}

export function serializePolarPayload(payload: unknown): Record<string, unknown> {
  const data = extractPolarPayloadData(payload);
  if (!data) {
    return {};
  }

  try {
    return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
  } catch {
    return {};
  }
}
