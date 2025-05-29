import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import { generateReferralCode, randomUsername } from "../utils/Random.js";
import { buildTree } from "../utils/BinaryTree.js";
import { getBinaryDownline } from "../utils/Downline.js";
import Investment from "../models/investment.model.js";
import Aroi from "../models/roi.model.js";
import Plan from "../models/plan.model.js";
import Support from "../models/support.model.js";
import Withdrawal from "../models/withdrwal.model.js";
import LevelIncome from "../models/LevelIncome.model.js";
import ReferalBonus from "../models/referalbonus.model.js";
import { verify2FA, generate2FA } from "../utils/2FA.js";

const findAvailablePosition = async (parentId) => {
  const queue = [parentId];

  while (queue.length > 0) {
    const currentUserId = queue.shift();
    const currentUser = await UserModel.findById(currentUserId);

    if (!currentUser) continue;

    if (!currentUser.left) {
      return { parent: currentUserId, position: "left" };
    }
    queue.push(currentUser.left);

    if (!currentUser.right) {
      return { parent: currentUserId, position: "right" };
    }
    queue.push(currentUser.right);
  }

  return null;
};
export const userRegister = async (req, res) => {
  try {
    const { walletAddress, referredBy, email, name } = req.body;
    if (!walletAddress || !email || !name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const existingUser = await UserModel.findOne({ walletAddress });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const referralCode = generateReferralCode();
    const username = randomUsername();

    const userCount = await UserModel.countDocuments();
    let role = "user";
    let parentId = null;
    let side = null;
    let sponsorId = null;

    if (userCount === 0) {
      role = "admin";
    } else {
      if (!referredBy) {
        return res.status(400).json({
          success: false,
          message: "Referral ID is required for registration.",
        });
      }

      const sponsorUser = await UserModel.findOne({ referralCode: referredBy });
      if (!sponsorUser) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral ID",
        });
      }

      sponsorId = sponsorUser._id;

      const placement = await findAvailablePosition(sponsorUser._id);
      if (!placement) {
        return res.status(400).json({
          success: false,
          message: "No available position found",
        });
      }

      parentId = placement.parent;
      side = placement.position;
    }

    const newUser = new UserModel({
      walletAddress,
      referralCode,
      name,
      email,
      sponserId: sponsorId,
      parentId: parentId,
      role,
      username,
      position: side,
      parentReferedCode: referredBy,
    });

    const savedUser = await newUser.save();
    const user = await UserModel.findById(savedUser._id).populate(
      "referedUsers"
    );

    if (sponsorId) {
      await UserModel.findByIdAndUpdate(sponsorId, {
        $push: { referedUsers: savedUser._id },
      });
    }

    if (parentId) {
      await UserModel.findByIdAndUpdate(parentId, {
        [side]: savedUser._id,
      });
    }

    const token = jwt.sign(
      { id: savedUser._id, walletAddress: savedUser.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res
      .cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: false,
      })
      .status(201)
      .json({
        success: true,
        message: "User registered successfully",
        user: {
          data: user,
        },
        token,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const userLogin = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet Address is required",
      });
    }

    const user = await UserModel.findOne({ walletAddress }).populate(
      "referedUsers"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res
      .cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: false,
        sameSite: "none",
      })
      .status(200)
      .json({
        success: true,
        token,
        data: user,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const userLogout = async (req, res) => {
  try {
    res.clearCookie("token", { path: "/" });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const investment = async (req, res) => {
  try {
    const { investmentAmount, txResponse, adminWalletAddress, userWalletAddress } = req.body;
    const userId = req.user._id;

    if (!userId || !investmentAmount || !txResponse || !adminWalletAddress || !userWalletAddress) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // if (investmentAmount < 100) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Minimum investment is ₹100 $",
    //   });
    // }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const existingInvestment = await Investment.findOne({ txResponse });
    if (existingInvestment) {
      return res.status(409).json({
        success: false,
        message: "This transaction has already been processed",
        investment: existingInvestment,
      });
    }

    const investment = await Investment.create({
      userId,
      investmentAmount,
      txResponse,
      investmentDate: new Date(),
      adminWalletAddress,
      userWalletAddress
    });
    user.investments.push(investment._id);
    user.totalInvestment += Number(investmentAmount);
    user.isVerified = true;
    user.status = true;
    user.activeDate = new Date();
    await user.save();

    if (user.sponserId) {
      const parentUser = await UserModel.findById(user.sponserId);
      if (parentUser && parentUser.status && parentUser.totalInvestment > 0) {
        const referralBonus = investmentAmount * 0.1;

        parentUser.directReferalAmount += referralBonus;
        parentUser.totalEarnings += referralBonus;
        parentUser.currentEarnings += referralBonus;
        await parentUser.save();

        await ReferalBonus.create({
          userId: parentUser._id,
          fromUser: user._id,
          amount: referralBonus,
          investmentId: investment._id,
          date: new Date(),
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Investment successful",
      investment,
    });
  } catch (error) {
    console.error("Error in Investment:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const getTotalRoi = async (req, res) => {
  try {
    const userId = req.user._id;
    const rois = await Aroi.find({ userId });
    const totalRoi = rois.reduce((acc, item) => acc + item.roiAmount, 0);
    console.log("Total ROI from Aroi documents:", totalRoi);
    res.status(200).json({ success: true, totalRoi });
  } catch (error) {
    console.error("Error in getTotalRoi:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    const userId = user._id;
    const userProfile = await UserModel.findById(userId).populate(
      "referedUsers"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: userProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getBinaryTree = async (req, res) => {
  try {
    const User = req.user;
    const userId = User._id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const tree = await buildTree(user._id);

    res.json({ success: true, tree });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getDowunlineUsers = async (req, res) => {
  try {
    const User = req.user;
    const userId = User._id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const downline = await getBinaryDownline(user._id);

    res.json({ success: true, downline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getAllPlan = async (req, res) => {
  try {
    const plans = await Plan.find({});
    console.log(plans);
    res.json({ success: true, data: plans });
  } catch (error) { }
};
export const helpAndSupport = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(userId);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { message, subject } = req.body;
    console.log(req.body);
    if (!message || !subject) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const support = await Support.create({
      userId,
      message,
      subject,
      createdAt: new Date(),
    });
    await support.save();
    res
      .status(201)
      .json({ success: true, message: "Support request sent Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getAllHelpAndSupportHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const supportHistory = await Support.find({ userId }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: supportHistory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getreferalHistoryByID = async (req, res) => {
  try {
    const userId = req.user?._id || req.admin?._id;
    console.log("User ID:", userId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const referalHistory = await ReferalBonus.find({ userId })
      .populate([
        { path: "userId", select: "username" }, // only username
        { path: "fromUser", select: "username" }, // optional: if you want only username here too
        { path: "investmentId" }, // full population for investmentId
      ])
      .sort({ createdAt: -1 });

    if (!referalHistory || referalHistory.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No referral history found for this user.",
      });
    }

    res.json({ success: true, data: referalHistory });
  } catch (error) {
    console.error("Error fetching referral history:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getInvestmentHistoryById = async (req, res) => {
  try {
    const userId = req.user?._id || req.admin?._id;
    console.log("User ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const investmentsHistory = await Investment.find({
      userId: userId,
    })
      .populate("userId")
      .sort({ createdAt: -1 });

    if (!investmentsHistory || investmentsHistory.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No investment history found for this user.",
      });
    }

    res.json({ success: true, data: investmentsHistory });
  } catch (error) {
    console.error("Error getting investment history:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};
// export const withdrawal = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { amount, walletAddress } = req.body;
//     if (!amount || !walletAddress) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }
//     const withdrawal = await Withdrawal.create({
//       userId,
//       amount,
//       userWalletAddress: walletAddress,
//       createdAt: new Date(),
//     });
//     await withdrawal.save();

//     return res.status(200).json({
//       success: true,
//       message: "Withdrawal request sent successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       message: error.message || "Server error",
//       success: false,
//     });
//   }
// };

export const getRoiIncomeHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(userId, "roi");

    if (!userId) {
      return res.status(400).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const getRois = await Aroi.find({ userId })
      .populate("userId investmentId")
      .sort({ createdAt: -1 });

    if (!getRois || getRois.length === 0) {
      return res.status(200).json({
        message: "No Roi history found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Roi History Fetched",
      success: true,
      data: getRois,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const getLevelIncomeHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const levelIncomesReport = await LevelIncome.find({ userId })
      .populate("fromUserId investmentId")
      .sort({ createdAt: -1 });

    if (levelIncomesReport.length === 0) {
      return res.status(200).json({
        message: "No Level Income History Found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Level Income History Reports",
      data: levelIncomesReport,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const getUsersCountByLevel = async (req, res) => {
  try {
    const userId = req.user._id;

    let levelCounts = [];
    let currentLevelUsers = [userId];
    const visited = new Set();

    for (let level = 1; level <= 5; level++) {
      const users = await UserModel.find(
        { _id: { $in: currentLevelUsers } },
        { referedUsers: 1 }
      );

      let nextLevelUserIds = [];

      users.forEach((user) => {
        if (user.referedUsers && user.referedUsers.length > 0) {
          user.referedUsers.forEach((refId) => {
            const idStr = refId.toString();
            if (!visited.has(idStr)) {
              visited.add(idStr);
              nextLevelUserIds.push(refId);
            }
          });
        }
      });

      const nextLevelUsers = await UserModel.find(
        { _id: { $in: nextLevelUserIds } },
        {
          username: 1,
          referralCode: 1,
          walletAddress: 1,
          totalInvestment: 1,
        }
      );

      levelCounts.push({
        level,
        count: nextLevelUsers.length,
        users: nextLevelUsers,
      });

      currentLevelUsers = nextLevelUserIds;
    }

    res.status(200).json({
      success: true,
      data: levelCounts,
    });
  } catch (error) {
    console.error("Error in getUsersCountByLevel:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const withdrawalHistory = async (req, res) => {
  try {
    const userId = req.user;
    console.log(userId);
    const allWithdrwal = await Withdrawal.find({ userId: userId })
      .populate("userId")
      .sort({ createdAt: -1 });
    if (!allWithdrwal) {
      return res.status(200).json({
        message: "No withdrwal History Found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Withdrwal History Fetched",
      success: false,
      data: allWithdrwal,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const generate2FAHandler = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const { secret, qrCode } = await generate2FA(walletAddress);

    return res.status(200).json({ secret, qrCode, success: true });
  } catch (error) {
    console.error("2FA Generation Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verify2FAHandler = (req, res) => {
  try {
    const { otp, secret } = req.body;

    if (!otp || !secret) {
      return res
        .status(400)
        .json({ error: "OTP and secret are required", success: false });
    }

    const verified = verify2FA(secret, otp);

    if (verified) {
      return res.status(200).json({ verified: true, success: true });
    } else {
      return res.status(200).json({ verified: false, success: false });
    }
  } catch (error) {
    console.error("2FA Verification Error:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", success: false });
  }
};


