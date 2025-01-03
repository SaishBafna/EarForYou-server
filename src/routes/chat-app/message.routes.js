import { Router } from "express";
import {
  deleteMessage,
  getAllMessages,
  sendMessage,
} from "../../controllers/chat-app/message.controllers.js";
import { protect } from "../../middlewares/auth/authMiddleware.js";
import { upload } from "../../middlewares/multer.middlewares.js";
import { sendMessageValidator } from "../../validators/chat-app/message.validators.js";
import { mongoIdPathVariableValidator } from "../../validators/common/mongodb.validators.js";
import { validate } from "../../validators/validate.js";

const router = Router();

router.use(protect);

router
  .route("/:chatId")
  .get(mongoIdPathVariableValidator("chatId"), validate, getAllMessages)
  .post(
    upload.fields([{ name: "attachments", maxCount: 5 }]),
    mongoIdPathVariableValidator("chatId"),
    sendMessageValidator(),
    validate,
    sendMessage
  );

//Delete message route based on Message id

router
  .route("/:chatId/:messageId")
  .delete(
    mongoIdPathVariableValidator("chatId"),
    mongoIdPathVariableValidator("messageId"),
    validate,
    deleteMessage
  );

export default router;
