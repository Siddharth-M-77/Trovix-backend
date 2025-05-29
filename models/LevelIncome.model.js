import mongoose from "mongoose";

const levelIncomeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel" },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel" },
    investmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Investment" },
    amount: Number,
    dayCount: Number,
    level: Number,
    percent: {
      type: Number,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const LevelIncome = mongoose.model("LevelIncome", levelIncomeSchema);
export default LevelIncome;
