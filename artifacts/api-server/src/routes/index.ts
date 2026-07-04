import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import socialAuthRouter from "./social-auth";
import googleOAuthRouter from "./google-oauth";
import babiesRouter from "./babies";
import memoriesRouter from "./memories";
import familyRouter from "./family";
import highlightsRouter from "./highlights";
import dreamTalesRouter from "./dream_tales";
import storageRouter from "./storage";
import notificationsRouter from "./notifications";
import commentsRouter from "./comments";
import pushRouter from "./push";
import appVersionRouter from "./app-version";
import legalRouter from "./legal";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(legalRouter);
router.use(storageRouter);
router.use(notificationsRouter);
router.use(authRouter);
router.use(socialAuthRouter);
router.use(googleOAuthRouter);
router.use(babiesRouter);
router.use(memoriesRouter);
router.use(familyRouter);
router.use(highlightsRouter);
router.use(dreamTalesRouter);
router.use(commentsRouter);
router.use(pushRouter);
router.use(appVersionRouter);
router.use(adminRouter);

export default router;
