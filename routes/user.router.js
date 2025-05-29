import express from "express";
import {
  generate2FAHandler,
  getAllHelpAndSupportHistory,
  getAllPlan,
  getBinaryTree,
  getDowunlineUsers,
  getInvestmentHistoryById,
  getLevelIncomeHistory,
  getProfile,
  getreferalHistoryByID,
  getRoiIncomeHistory,
  getTotalRoi,
  getUsersCountByLevel,
  helpAndSupport,
  investment,
  userLogin,
  userLogout,
  userRegister,
  verify2FAHandler,
  withdrawalHistory,
} from "../controllers/user.controller.js";
import IsAuthenticated from "../middlewares/IsAuthenticated.js";
import { processWithdrawal } from "../controllers/withdrwal.controller.js";
import { getBanners } from "../controllers/admin.controller.js";

const router = express.Router();

router.route("/register").post(userRegister);
router.route("/login").post(userLogin);
router.route("/logout").post(IsAuthenticated, userLogout);
router.route("/get-packages").get(getAllPlan);
router.route("/get-Profile").get(IsAuthenticated, getProfile);
router.route("/getRoi-history").get(IsAuthenticated, getRoiIncomeHistory);
router
  .route("/getLevelIncome-history")
  .get(IsAuthenticated, getLevelIncomeHistory);
router
  .route("/investment-history")
  .get(IsAuthenticated, getInvestmentHistoryById);
router.route("/buy-package").post(IsAuthenticated, investment);
router.route("/get-binary").get(IsAuthenticated, getBinaryTree);
// router.route("/get-downline").get(IsAuthenticated, getDowunlineUsers);
router.route("/support/create").post(IsAuthenticated, helpAndSupport);
router.route("/getreferal-history").get(IsAuthenticated, getreferalHistoryByID);
router.route("/getLevelUsers").get(IsAuthenticated, getUsersCountByLevel);
router.route("/withdrawal-request").post(IsAuthenticated, processWithdrawal);
router
  .route("/support/messages")
  .get(IsAuthenticated, getAllHelpAndSupportHistory);
router.get("/get-banners", getBanners);
router.get("/withdrawals-history", IsAuthenticated, withdrawalHistory);
router.post("/generate-2fa", IsAuthenticated, generate2FAHandler);
router.post("/verify-2fa", IsAuthenticated, verify2FAHandler);

export default router;
