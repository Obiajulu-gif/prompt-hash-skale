import mongoose from "mongoose";

const paymentReceiptSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    walletAddress: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "requires_payment",
        "payment_submitted",
        "settled",
        "failed",
        "policy_rejected",
      ],
      index: true,
    },
    reasonCode: {
      type: String,
      required: true,
      index: true,
    },
    network: {
      type: String,
      required: false,
      index: true,
    },
    asset: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
    amountAtomic: {
      type: String,
      required: false,
    },
    txHash: {
      type: String,
      required: false,
      index: true,
    },
    facilitatorUrl: {
      type: String,
      required: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

paymentReceiptSchema.index({ createdAt: -1 });

const PaymentReceipt =
  mongoose.models.PaymentReceipt ||
  mongoose.model("PaymentReceipt", paymentReceiptSchema);

export default PaymentReceipt;
