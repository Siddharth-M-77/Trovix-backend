import Investment from "../models/investment.model.js";
import LevelIncome from "../models/LevelIncome.model.js";
import UserModel from "../models/user.model.js";

const levelIncomePercentages = [0.3, 0.2, 0.1, 0.1, 0.1];

export const distributeLevelIncome = async () => {
  try {
    const investments = await Investment.find({});

    for (const invest of investments) {
      const fromUser = await UserModel.findById(invest.userId);
      let sponsor = await UserModel.findById(fromUser?.sponserId);
      let currentLevel = 1;

      while (sponsor && currentLevel <= 5) {
        if (sponsor.totalEarnings >= sponsor.totalInvestment * 4) {
          console.log(
            `❌ Level income stopped for ${sponsor.username} (4x reached)`
          );
          sponsor = await UserModel.findById(sponsor.sponserId);
          currentLevel++;
          continue;
        }

        const existingIncomes = await LevelIncome.find({
          userId: sponsor._id,
          fromUserId: fromUser._id,
          investmentId: invest._id,
          level: currentLevel,
        });

        if (existingIncomes.length < 100) {
          const percent = levelIncomePercentages[currentLevel - 1];
          const totalLevelIncome =
            invest.investmentAmount * levelIncomePercentages[currentLevel - 1];
          const dailyIncome = totalLevelIncome / 100;

          await LevelIncome.create({
            userId: sponsor._id,
            fromUserId: fromUser._id,
            investmentId: invest._id,
            amount: dailyIncome,
            dayCount: existingIncomes.length + 1,
            level: currentLevel,
            percent: percent * 100,
          });

          sponsor.totalEarnings += dailyIncome;
          sponsor.levelIncome += dailyIncome;
          sponsor.currentEarnings += dailyIncome;
          await sponsor.save();

          console.log(`✅ Level ${currentLevel}: ₹${dailyIncome.toFixed(2)} credited to ${sponsor.username} from ${fromUser.username}`);
        }

        const expectedTotal =
          invest.investmentAmount * levelIncomePercentages[currentLevel - 1];
        const allIncomes = await LevelIncome.find({
          userId: sponsor._id,
          fromUserId: fromUser._id,
          investmentId: invest._id,
          level: currentLevel,
        });

        const receivedTotal = allIncomes.reduce(
          (acc, val) => acc + val.amount,
          0
        );
        const difference = expectedTotal - receivedTotal;

        console.log(`--- DEBUG LEVEL ${currentLevel} for ${sponsor.username} ---`);
        console.log(`Expected: ₹${expectedTotal.toFixed(2)} | Received: ₹${receivedTotal.toFixed(2)} | Difference: ₹${difference.toFixed(2)}\n`);

        sponsor = await UserModel.findById(sponsor.sponserId);
        currentLevel++;
      }
    }
  } catch (error) {
    console.error("❌ Error in distributeLevelIncome:", error.message);
  }
};
