import cron from "node-cron";
import { distributeDailyROI } from "./distributeDailyROI.js";
import { distributeLevelIncome } from "./levelIncome.js";

const logError = (taskName, error) => {
    console.error(`❌ Error in ${taskName}:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
    });
};

const runCronTask = (taskName, taskFunction) => async () => {
    try {
        console.log(`🚀 Starting ${taskName} at ${new Date().toISOString()}`);
        await taskFunction();
        console.log(`✅ ${taskName} completed successfully`);
    } catch (error) {
        logError(taskName, error);
    }
};

cron.schedule("0 0 * * *", runCronTask("distributeDailyROI", distributeDailyROI));
cron.schedule("0 0 * * *", runCronTask("distributeLevelIncome", distributeLevelIncome));

