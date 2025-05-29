import mongoose from "mongoose";
const topupSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        txResponse: {
            type: String,
            required: true,
            unique: true,
        },
    },
    { timestamps: true }
);
const Topup = mongoose.model("Topup", topupSchema);
export default Topup;