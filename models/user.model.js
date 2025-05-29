import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    referralCode: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },

    sponserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
    },
    twoFASecret: {
      type: String,
    },
    username: {
      type: String,
      unique: true,
    },
    parentReferedCode: {
      type: String,
      default: null,
    },

    left: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
    },
    right: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
    },
    position: { type: String, default: null },
    referedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserModel" }],
    totalEarnings: { type: Number, default: 0 },
    currentEarnings: { type: Number, default: 0 },
    walletAddress: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"] },
    status: { type: Boolean, default: false },
    activeDate: { type: Date, default: null },
    totalPayouts: {
      type: Number,
      default: 0,
    },
    investments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Investment" }],
    totalInvestment: {
      type: Number,
      default: 0,
    },
    dailyRoi: {
      type: Number,
      default: 0,
    },
    totalRoi: {
      type: Number,
      default: 0,
    },
    levelIncome: {
      type: Number,
      default: 0,
    },
    directReferalAmount: {
      type: Number,
      default: 0,
    },
    withdrawalCount: {
      type: Number,
      default: 0,
    },
    lastWithdrawalDate: {
      type: Date,
    },
  },

  { timestamps: true }
);

userSchema.index({ walletAddress: 1 }, { unique: true });

const UserModel = mongoose.model("UserModel", userSchema);
export default UserModel;
