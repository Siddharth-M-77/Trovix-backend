import {
  JsonRpcProvider,
  Wallet,
  Contract,
  parseUnits,
  isAddress,
} from "ethers";
import dotenv from "dotenv";
import Withdrawal from "../models/withdrwal.model.js";
import Settings from "../models/settings.model.js";
import UserModel from "../models/user.model.js";

dotenv.config();

const provider = new JsonRpcProvider("https://bsc-dataseed.binance.org/");

// Server wallet with signer
const wallet = new Wallet(process.env.PRIVATE_KEY, provider);

const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
const usdtABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];
const usdtContract = new Contract(usdtAddress, usdtABI, wallet);

export const processWithdrawal = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    const { userWalletAddress, amount } = req.body;
    console.log(userWalletAddress, amount);

    if (!userWalletAddress || !amount) {
      return res
        .status(400)
        .json({ error: "Missing wallet address or amount" });
    }
    if (!isAddress(userWalletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const settings = await Settings.findOne();
    const withdrawalLimit = settings?.withdrawalLimit || 3;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayWithdrawals = await Withdrawal.find({
      userWalletAddress,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (todayWithdrawals.length >= withdrawalLimit) {
      return res.status(400).json({
        message: "Daily withdrawal limit reached",
        success: false,
      });
    }

    const feePercentage = 10;
    const feeAmount = (amount * feePercentage) / 100;
    const netAmount = amount - feeAmount;

    const amountWei = parseUnits(netAmount.toString(), 18);

    const serverBalance = await usdtContract.balanceOf(wallet.address);
    if (serverBalance < amountWei) {
      return res.status(400).json({
        success: false,
        message:
          "Transaction could not be processed at the moment. Please try again later.",
      });
    }

    const tx = await usdtContract.transfer(userWalletAddress, amountWei, {
      gasLimit: 210000,
    });
    const receipt = await tx.wait();

    const txStatus = receipt.status ? "success" : "failed";

    await Withdrawal.create({
      userId,
      userWalletAddress,
      amount,
      feeAmount,
      netAmountSent: netAmount,
      transactionHash: receipt.hash,
      status: txStatus,
    });

    if (txStatus === "success") {
      user.currentEarnings -= amount;
      user.totalPayouts += amount;
      await user.save();
    }

    return res.status(200).json({
      message: `Withdrawal ${txStatus}`,
      transactionHash: receipt.hash,
      success: txStatus === "success",
    });
  } catch (error) {
    console.error("Withdrawal error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process withdrawal",
    });
  }
};
