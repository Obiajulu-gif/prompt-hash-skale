export type PaymentState =
  | "idle"
  | "requesting"
  | "payment_required"
  | "policy_checked"
  | "awaiting_confirmation"
  | "paying"
  | "settled"
  | "failed";

export type PaymentEvent =
  | "start"
  | "payment_required_received"
  | "policy_ok"
  | "confirm"
  | "submit"
  | "settle_ok"
  | "error";

const transitions: Record<PaymentState, Partial<Record<PaymentEvent, PaymentState>>> = {
  idle: { start: "requesting" },
  requesting: {
    payment_required_received: "payment_required",
    error: "failed",
  },
  payment_required: {
    policy_ok: "policy_checked",
    error: "failed",
  },
  policy_checked: {
    confirm: "awaiting_confirmation",
    error: "failed",
  },
  awaiting_confirmation: {
    submit: "paying",
    error: "failed",
  },
  paying: {
    settle_ok: "settled",
    error: "failed",
  },
  settled: {},
  failed: {},
};

export function transitionPaymentState(
  current: PaymentState,
  event: PaymentEvent,
): PaymentState {
  const next = transitions[current][event];
  if (!next) {
    throw new Error(`Invalid payment state transition: ${current} -> ${event}`);
  }
  return next;
}
