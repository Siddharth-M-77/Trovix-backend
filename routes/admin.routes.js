import express from "express";
import IsAuthenticated from "../middlewares/IsAuthenticated.js";
import {
  adminLogin,
  adminRegister,
  allUsers,
  allWithdrwal,
  deleteBanner,
  getAllIncomes,
  getAllMessage,
  // getAllLevelIncome,
  getAllReferalBonus,
  getAllTopups,
  getAllUsers,
  getBanners,
  getDailyRoi,
  getLevelIncomeHistory,
  getProfile,
  getRoiHistory,
  getTotalInvestedUsers,
  ticketApprove,
  ticketReject,
  updateGlobalLimit,
  uploadBanner,
  userTopup,
} from "../controllers/admin.controller.js";
import { createPlan } from "../controllers/plan.controller.js";
import { isAdminAuthenticated } from "../middlewares/adminMiddleware.js";
import upload from "../utils/multer.js";
import bannerUpload from "../utils/multer.js";

const router = express.Router();

router.route("/register").post(adminRegister);
router.route("/login").post(adminLogin);
router.route("/getProfile").get(isAdminAuthenticated, getProfile);
router.route("/getAllUsers").get(isAdminAuthenticated, allUsers);
router.route("/getAllRoi-history").get(isAdminAuthenticated, getDailyRoi);
router.route("/getAllIncomes").get(isAdminAuthenticated, getAllIncomes);
router.route("/create-plan").post(isAdminAuthenticated, createPlan);
router
  .route("/getAllInvestedUsers")
  .get(isAdminAuthenticated, getTotalInvestedUsers);
router
  .route("/getAllReferalBonus-history")
  .get(IsAuthenticated, getAllReferalBonus);
router
  .route("/getAllLevelIncome-history")
  .get(isAdminAuthenticated, getLevelIncomeHistory);
router.route("/support-in-process").get(isAdminAuthenticated, getAllMessage);
router.post(
  "/support/status/approve/:ticketId",
  isAdminAuthenticated,
  ticketApprove
);

router.post(
  "/support/status/reject/:ticketId",
  isAdminAuthenticated,
  ticketReject
);
router.get("/get-roi-history", isAdminAuthenticated, getRoiHistory);
router.post("/upload-banner", bannerUpload.single("banner"), uploadBanner);
router.get("/get-banners", getBanners);
router.get("/delete-banner/:id", deleteBanner);
router.get("/withdrwal-limit", isAdminAuthenticated, updateGlobalLimit);
router.get("/all-users", isAdminAuthenticated, getAllUsers);
router.get("/withdrawal-reports", isAdminAuthenticated, allWithdrwal);
router.post("/admin-topup", isAdminAuthenticated, userTopup);
router.get("/topUp-history", isAdminAuthenticated, getAllTopups);

export default router;
