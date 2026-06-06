import { Router } from "express";
import {healthTemplate,getTemplateMe,getTemplate,uploadBackground,selectBackground,deleteBackground,saveLayout, getPlaceholders, getTemplateForDocument} from "../controllers/template.controller.js";
import {verifyToken,authorizeRoles, verifyInternalService,} from "../middlewares/auth.middleware.js";
import { uploadTemplateBackground } from "../middlewares/upload.middleware.js";
const router = Router();

const adminOnly = [verifyToken, authorizeRoles("admin")];

router.get("/health", healthTemplate);

router.get("/me", verifyToken, getTemplateMe);
router.post("/:jenis/background", adminOnly, uploadTemplateBackground.single("file"), uploadBackground);
router.patch("/:jenis/background/select", adminOnly, selectBackground);
router.delete("/:jenis/background/:assetId", adminOnly, deleteBackground);  
router.put("/:jenis/layout", adminOnly, saveLayout);  
router.get("/:jenis/placeholders", adminOnly, getPlaceholders);
router.get("/internal/:jenis", verifyInternalService, getTemplateForDocument);
// Menu template builder hanya untuk admin
router.get("/:jenis", adminOnly, getTemplate);


  
export default router;