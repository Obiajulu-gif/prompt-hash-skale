export const PAYMENT_REASON_CODES = {
  paymentRequired: "PAYMENT_REQUIRED",
  paymentSubmitted: "PAYMENT_SUBMITTED",
  settled: "SETTLED",
  settleFailed: "SETTLE_FAILED",
  verifyFailed: "VERIFY_FAILED",
  tokenNotAllowed: "POLICY_REJECTED_TOKEN_NOT_ALLOWED",
  maxPerTxExceeded: "POLICY_REJECTED_MAX_PER_TX",
  dailyCapExceeded: "POLICY_REJECTED_DAILY_CAP",
  userDeclined: "USER_DECLINED_CONFIRMATION",
  requestTimeout: "REQUEST_TIMEOUT",
  networkError: "NETWORK_ERROR",
  unexpectedError: "UNEXPECTED_ERROR",
} as const;

export type PaymentReasonCode =
  (typeof PAYMENT_REASON_CODES)[keyof typeof PAYMENT_REASON_CODES];
