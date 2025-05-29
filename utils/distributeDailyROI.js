import Investment from "../models/investment.model.js";
import Aroi from "../models/roi.model.js";
import UserModel from "../models/user.model.js";

export const distributeDailyROI = async () => {
  try {
    const today = new Date().getDay();
    if (today === 0 || today === 6) {
      console.log("Weekend off: No ROI distribution today.");
      return;
    }

    const investments = await Investment.find({});

    for (const invest of investments) {
      console.log(invest.userId, "invest.userId");
      const existingRois = await Aroi.find({ investmentId: invest._id });

      if (existingRois.length < 100) {
        const roiAmount = invest.investmentAmount * 0.02;
        const user = await UserModel.findById(invest.userId);

        if (user.totalEarnings >= user.totalInvestment * 4) {
          console.log(
            `❌ ROI stopped for ${user.username} (4x earnings reached)`
          );
          continue;
        }

        // Save ROI entry
        await Aroi.create({
          userId: invest.userId,
          investmentId: invest._id,
          roiAmount,
          dayCount: existingRois.length + 1,
        });

        // Add to user's earnings
        user.totalEarnings += roiAmount;
        user.dailyRoi += roiAmount;
        user.totalRoi += roiAmount;
        user.currentEarnings += roiAmount;
        await user.save();
      }
    }
  } catch (error) {
    console.error("Error in distributeDailyROI:", error);
  }
};

