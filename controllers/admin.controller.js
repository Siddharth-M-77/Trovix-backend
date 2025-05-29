import Admin from "../models/admin.model.js";
import Investment from "../models/investment.model.js";
import LevelIncome from "../models/LevelIncome.model.js";
import ReferalBonus from "../models/referalbonus.model.js";
import Aroi from "../models/roi.model.js";
import Support from "../models/support.model.js";
import UserModel from "../models/user.model.js";
import Withdrawal from "../models/withdrwal.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path, { dirname } from "path";
import fs from "fs";
import Banner from "../models/banner.model.js";
import { fileURLToPath } from "url";
import Settings from "../models/settings.model.js";
import { generateTxHash } from "../utils/Random.js";
import Topup from "../models/admin.topup.js";

export const adminRegister = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    if (!email || !password) {
      return res.status(400).json({
        message: "All Feild are requireds",
        success: false,
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      email,
      password: hashPassword,
    });
    if (!newAdmin) {
      return res.status(400).json({
        message: "User Not Created",
        success: false,
      });
    }
    const admin = await newAdmin.save();

    return res.status(200).json({
      message: "Register Successfull",
      success: true,
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    const user = await Admin.findOne({ email: email.toLowerCase() }); // Consider case-insensitive search
    if (!user) {
      return res.status(401).json({
        // 401 Unauthorized might be more appropriate
        message: "User not found",
        success: false,
      });
    }

    // Compare passwords
    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set cookie and send response
    return res
      .cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Secure in production
        sameSite: "none",
      })
      .status(200)
      .json({
        success: true,
        token,
        data: {
          _id: user._id,
          email: user.email,
          walletAddress: user.walletAddress,
          // Only return necessary fields, avoid sending password hash
        },
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server error",
      success: false,
    });
  }
};
export const getProfile = async (req, res) => {
  try {
    const userId = req.admin;
    console.log(userId, "admin");
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const user = await Admin.findById(userId);
    if (!user) {
      return res.status(200).json({
        message: "User not found",
      });
    }
    return res.status(200).json({
      message: "User Profile",
      data: user,
      success: true,
    });
  } catch (error) { }
};
export const getDailyRoi = async (req, res) => {
  try {
    const userId = req.admin;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const dailyRoi = await Aroi.find({})
      .populate("userId investmentId")
      .sort({ date: -1 });
    return res.status(200).json({
      message: "All User DailyRoi History",
      data: dailyRoi,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};
export const allUsers = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const users = await UserModel.find();
    if (!users || users.length === 0) {
      return res.status(200).json({
        message: "No users found",
        data: [],
        success: true,
      });
    }

    return res.status(200).json({
      message: "All Users",
      data: users,
      success: true,
    });
  } catch (error) {
    console.error("Error in allUsers:", error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({});
    if (!users) {
      return res.status(200).json({
        message: "no users",
        data: [],
      });
    }

    return res.status(200).json({
      message: "All Users",
      data: users,
    });
  } catch (error) { }
};
export const getAllLevelIncome = async (req, res) => {
  try {
    const userId = req.admin;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const levelIncome = await LevelIncome.find({}).populate(
      "userId fromUserId investmentId"
    );
    return res.status(200).json({
      message: "All User Level Income History",
      data: levelIncome,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

export const getAllReferalBonus = async (req, res) => {
  try {
    const userId = req.admin || req.user;
    console.log(userId, "admin");
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const referalBonus = await ReferalBonus.find({})
      .populate("userId fromUser investmentId")
      .sort({ createdAt: -1 });
    if (!referalBonus) {
      return res.status(200).json({
        message: "No referal bonus found",
      });
    }
    return res.status(200).json({
      message: "All User Referal Bonus History",
      data: referalBonus,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

export const getAllIncomes = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const totalUsers = await UserModel.countDocuments();

    // Total and Today's Investment
    const investments = await Investment.find({});
    const totalInvestment = investments.reduce(
      (sum, inv) => sum + inv.investmentAmount,
      0
    );
    const todayInvestments = await Investment.find({
      investmentDate: { $gte: todayStart, $lte: todayEnd },
    });
    const todayInvestment = todayInvestments.reduce(
      (sum, inv) => sum + inv.investmentAmount,
      0
    );

    // Total ROI
    const rois = await Aroi.find({});
    const totalRoi = rois.reduce((sum, roi) => sum + roi.roiAmount, 0);

    // Today ROI
    const todayRois = await Aroi.find({
      creditedOn: { $gte: todayStart, $lte: todayEnd },
    });
    const todayRoi = todayRois.reduce((sum, roi) => sum + roi.roiAmount, 0);

    // Total and Today's Level Income
    const levelIncomes = await LevelIncome.find({});
    const totalLevelIncome = levelIncomes.reduce(
      (sum, inc) => sum + inc.amount,
      0
    );
    const todayLevelIncomes = await LevelIncome.find({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });
    const todayLevelIncome = todayLevelIncomes.reduce(
      (sum, inc) => sum + inc.amount,
      0
    );

    // Total and Today's Direct Referral Income
    const referrals = await ReferalBonus.find({});
    const totalDirectReferral = referrals.reduce(
      (sum, ref) => sum + ref.amount,
      0
    );
    const todayReferrals = await ReferalBonus.find({
      date: { $gte: todayStart, $lte: todayEnd },
    });
    const todayDirectReferral = todayReferrals.reduce(
      (sum, ref) => sum + ref.amount,
      0
    );

    // Total and Today's Withdrawals
    const withdrawals = await Withdrawal.find({});
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const todayWithdrawals = await Withdrawal.find({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });
    const todayWithdrawal = todayWithdrawals.reduce(
      (sum, w) => sum + w.amount,
      0
    );

    return res.status(200).json({
      message: "Platform Income Summary",
      success: true,
      data: {
        totalUsers,
        totalInvestment,
        todayInvestment,
        totalRoi,
        todayRoi,
        totalLevelIncome,
        todayLevelIncome,
        totalDirectReferral,
        todayDirectReferral,
        totalWithdrawals,
        todayWithdrawal,
      },
    });
  } catch (error) {
    console.error("Error in getAllIncomes:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getTotalInvestedUsers = async (_, res) => {
  try {
    const allInvestUsers = await Investment.find({}).populate("userId");

    if (!allInvestUsers) {
      return res.status(200).json({
        message: "No Invested Users",
        success: false,
      });
    }

    return res.status(200).json({
      message: "All Invested Users",
      success: false,
      data: allInvestUsers,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "server error",
      success: false,
    });
  }
};

export const getLevelIncomeHistory = async (_, res) => {
  try {
    const getAllLevelIncomes = await LevelIncome.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "userId fromUserId",
        select: "username walletAddress levelIncome",
      })
      .populate({
        path: "investmentId",
        select: "investmentAmount investmentDate",
      });

    if (!getAllLevelIncomes) {
      return res.status(404).json({
        message: "No Level Income History Found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "LevelIncome History",
      success: true,
      data: getAllLevelIncomes,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Errro",
    });
  }
};

export const getAllMessage = async (req, res) => {
  try {
    const allTickets = await Support.find({}).sort({ createdAt: -1 });
    if (!allTickets) {
      return res.sta(200).json({
        messae: "No Tickets Founds",
        success: false,
      });
    }
    return res.status(200).json({
      message: "All Tickets Fetched",
      success: false,
      data: allTickets,
    });
  } catch (error) { }
};

export const ticketApprove = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({
        message: "Ticket Id && message are required",
        success: false,
      });
    }

    const ticket = await Support.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
        success: false,
      });
    }

    ticket.status = "Approved";
    ticket.response = message;
    await ticket.save();

    return res.status(200).json({
      message: "Ticket Approved Successfully",
      success: true,
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const ticketReject = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({
        message: "Ticket Id  & message are required",
        success: false,
      });
    }

    const ticket = await Support.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
        success: false,
      });
    }

    ticket.status = "Rejected";
    ticket.response = message;
    await ticket.save();

    return res.status(200).json({
      message: "Ticket Rejected Successfully",
      success: true,
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const getRoiHistory = async (req, res) => {
  try {
    const roiHistories = await Aroi.find({}).populate("userId investmentId");
    if (!roiHistories) {
      return res.status(200).json({
        message: "Roi history not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "ROI History Fetched",
      success: false,
      data: roiHistories,
    });
  } catch (error) { }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let currentBanner = null;

export const uploadBanner = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({
        message: "title is required",
        success: false,
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No banner uploaded" });
    }

    const newBanner = new Banner({
      imageUrl: `/uploads/banners/${req.file.filename}`,
      title: title,
    });

    await newBanner.save();

    res.status(201).json({
      message: "Banner uploaded successfully",
      banner: newBanner,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Banner upload failed", error: error.message });
  }
};

export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    console.log(banners);
    res.status(200).json({
      message: "Banners fetched successfully",
      success: true,
      data: banners,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch banners",
      success: false,
      error: error.message,
    });
  }
};
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    const imagePath = path.join(__dirname, ".. ", banner.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete banner", error: error.message });
  }
};
export const updateGlobalLimit = async (req, res) => {
  const { newLimit } = req.body;

  if (!newLimit || isNaN(newLimit)) {
    return res.status(400).json({ message: "Invalid limit" });
  }

  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ withdrawalLimit: newLimit });
    } else {
      settings.withdrawalLimit = newLimit;
      await settings.save();
    }

    res.json({ message: "Global withdrawal limit updated", success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to update", error: err.message });
  }
};
export const allWithdrwal = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(400).json({
        messae: "Please Login First",
        success: false,
      });
    }

    const allWithdrwals = await Withdrawal.find({}).populate("userId");
    if (!allWithdrwals) {
      return res.status(200).json({
        message: "No Withdrwal Founds",
        success: false,
      });
    }
    return res.status(200).json({
      message: "All withdrwal fetched",
      success: true,
      data: allWithdrwals,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.messae || "Server Error",
      success: false,
    });
  }
};
export const userTopup = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!req.admin) {
      return res.status(403).json({
        message: "Unauthorized access",
        success: false,
      });
    }



    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        message: "Valid userId is required",
        success: false,
      });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
        success: false,
      });
    }

    const user = await UserModel.findOne({ username: userId });
    console.log(user, "user");
    console.log(user.sponserId, "sponserId");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const session = await UserModel.startSession();
    try {
      await session.withTransaction(async () => {
        const txHash = await generateTxHash();

        // Create investment
        const [investment] = await Investment.create([{
          userId: user._id,
          investmentAmount: amount,
          investmentDate: new Date(),
          txResponse: txHash,
        }], { session });

        // Create topup record
        await Topup.create([{
          userId: user._id,
          amount,
          txResponse: txHash,
        }], { session });

        // Handle referral bonus
        if (user.sponserId) {
          const parentUser = await UserModel.findById(user.sponserId).session(session);
          if (parentUser) {
            const referralBonus = amount * 0.1;

            parentUser.directReferalAmount += referralBonus;
            parentUser.totalEarnings += referralBonus;
            parentUser.currentEarnings += referralBonus;
            await parentUser.save({ session });

            await ReferalBonus.create([{
              userId: parentUser._id,
              fromUser: user._id,
              amount: referralBonus,
              investmentId: investment._id,
              date: new Date(),
            }], { session });
          }
        }

        // Update user investment data
        user.totalInvestment = (user.totalInvestment || 0) + amount;
        user.isVerified = true;
        user.activeDate = new Date();
        user.status = true;
        await user.save({ session });
      });

      return res.status(200).json({
        message: "Topup successful",
        success: true,
        data: {
          userId: user._id,
          amount,
          newBalance: user.totalInvestment,
        },
      });
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Topup error:', error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

export const getAllTopups = async (req, res) => {
  try {
    const userId = req.admin;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const topups = await Topup.find({}).populate("userId", "username");
    if (!topups || topups.length === 0) {
      return res.status(200).json({
        message: "No topups found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "All Topups Fetched",
      success: true,
      data: topups,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};