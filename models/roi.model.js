import mongoose from "mongoose";

const aroiSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Investment",
    required: true,
  },
  roiAmount: {
    type: Number,
    required: true,
  },
  dayCount: {
    type: Number,
    required: true,
  },
  creditedOn: {
    type: Date,
    default: Date.now,
  },
});

const Aroi = mongoose.model("Aroi", aroiSchema);
export default Aroi;
