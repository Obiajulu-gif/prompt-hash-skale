import test from "node:test";
import assert from "node:assert/strict";
import { transitionPaymentState } from "../src/lib/payments/stateMachine";

test("follows deterministic happy-path transitions", () => {
  let state = "idle" as const;
  state = transitionPaymentState(state, "start");
  assert.equal(state, "requesting");

  state = transitionPaymentState(state, "payment_required_received");
  assert.equal(state, "payment_required");

  state = transitionPaymentState(state, "policy_ok");
  assert.equal(state, "policy_checked");

  state = transitionPaymentState(state, "confirm");
  assert.equal(state, "awaiting_confirmation");

  state = transitionPaymentState(state, "submit");
  assert.equal(state, "paying");

  state = transitionPaymentState(state, "settle_ok");
  assert.equal(state, "settled");
});

test("throws on invalid transition", () => {
  assert.throws(
    () => transitionPaymentState("idle", "settle_ok"),
    /Invalid payment state transition/,
  );
});
