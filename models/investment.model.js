import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },

    investmentAmount: {
      type: Number,
      required: true,
    },
    investmentDate: {
      type: Date,
      default: Date.now,
    },
    adminWalletAddress: {
      type: String,
      // required: true,
    },
    userWalletAddress: {
      type: String,
      // required: true,
    },
    txResponse: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const Investment = mongoose.model("Investment", investmentSchema);

export default Investment;
