import express from 'express';
// import { verifyPayment } from '../../controllers/Recharge/RechargeWallet.js'
import { initiatePayment,validatePayment } from '../../controllers/Recharge/RechargeWallet.js'
import { deductPerMinute } from '../../controllers/Recharge/Decudition.js'
import { protect } from '../../middlewares/auth/authMiddleware.js'
const router = express.Router();

router.post("/pay", initiatePayment);

// Route to validate payment
router.post("/validate", protect,validatePayment);
// router.get("/validate/:merchantTransactionId/:userId", validatePayment);


// router.post('/verify-payment', verifyPayment);
router.post('/deductPerMinute', deductPerMinute);
// router.get('/balance/:userId', getWalletAmount);

export default router;
