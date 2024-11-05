import axios from 'axios';
import crypto from 'crypto';
import Wallet from '../../models/Wallet/Wallet.js';

import sha256 from "sha256";
import uniqid from "uniqid";


export const initiatePayment = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (amount < 100) {
      await logTransaction(transactionId, 'VALIDATION_FAILED', new Error('Amount below minimum'));
      return res.status(400).json({
        success: false,
        message: 'Minimum recharge amount is 100'
      });
    }
    // Transaction amount from query params
   

  

    // Generate a unique merchant transaction ID
    const merchantTransactionId = uniqid();

    // Create the payload for PhonePe
    const normalPayLoad = {
      merchantId: process.env.MERCHANT_ID, // Ensure you use the merchant ID from environment variables
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: amount * 100, // converting to paise
      redirectUrl: `${process.env.APP_BE_URL}/api/v1/validate/${merchantTransactionId}/${userId}`,
      redirectMode: "REDIRECT",
      mobileNumber: "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // Encode the payload to base64
    const bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
    const base64EncodedPayload = bufferObj.toString("base64");

    // Create the X-VERIFY checksum
    const stringToHash = base64EncodedPayload + "/pg/v1/pay" + process.env.SALT_KEY;
    const sha256Hash = sha256(stringToHash);
    const xVerifyChecksum = `${sha256Hash}###${process.env.SALT_INDEX}`;

    // Make the request to PhonePe
    const response = await axios.post(
      `${process.env.PHONE_PE_HOST_URL}/pg/v1/pay`,
      { request: base64EncodedPayload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          accept: "application/json",
        },
      }
    );

    // Redirect the user to the payment page
    return res.status(200).json({
      success: true,
      paymentUrl: response.data.data.instrumentResponse.redirectInfo.url
    });
  } catch (error) {
    console.error("Error in payment initiation:", error);
    return res.status(500).send({ error: "Payment initiation failed" });
  }
};


export const validatePayment = async (req, res) => {
  const { merchantTransactionId, userId } = req.params; // Since we're now passing it in the URL params
  console.log("userId and merchantTransactionId:", userId, merchantTransactionId);
  if (!merchantTransactionId) {
    return res.status(400).send("Invalid transaction ID");
  }
  if (!userId) {
    return res.status(400).send("Invalid UserId ID");
  }

  try {
    // Construct the status URL
    const statusUrl = `${process.env.PHONE_PE_HOST_URL}/pg/v1/status/${process.env.MERCHANT_ID}/${merchantTransactionId}`;

    // Create the X-VERIFY checksum
    const stringToHash = `/pg/v1/status/${process.env.MERCHANT_ID}/${merchantTransactionId}${process.env.SALT_KEY}`;
    const sha256Hash = sha256(stringToHash);
    const xVerifyChecksum = `${sha256Hash}###${process.env.SALT_INDEX}`;

    // Make the request to check payment status
    const response = await axios.get(statusUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerifyChecksum,
        "X-MERCHANT-ID": merchantTransactionId,
        accept: "application/json",
      },
    });

    console.log("Payment validation response->", response.data);

    // Check if the payment was successful
    if (response.data && response.data.code === "PAYMENT_SUCCESS") {
      const { amount } = response.data.data;
      
      let wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        wallet = await Wallet.create({
          userId: userId,
          balance: 0,
          currency: 'inr', // matches schema default
          recharges: [],
          deductions: [],
          lastUpdated: new Date()
        });
      }

      // Create recharge object matching your schema exactly
      const newRecharge = {
        amount: amount / 100, // Convert from paise to rupees
        merchantTransactionId: merchantTransactionId,
        state: response.data.data.state || 'COMPLETED',
        responseCode: response.data.code,
        rechargeMethod: "PhonePe",
        rechargeDate: new Date(),
        transactionId: merchantTransactionId // Using merchantTransactionId as transactionId
      };

      // Calculate new balance
      const newBalance = Number(wallet.balance) + Number(newRecharge.amount);
      
      // Update wallet
      wallet.balance = newBalance;
      wallet.recharges.push(newRecharge);
      // lastUpdated will be automatically updated by the pre-save hook

      await wallet.save();

      return res.status(200).send({ 
        success: true, 
        message: "Payment validated and wallet updated",
        data: {
          balance: wallet.balance,
          transaction: newRecharge
        }
      });
    } else {
      // For failed payments
      let wallet = await Wallet.findOne({ userId });
      
      if (wallet) {
        const failedRecharge = {
          amount: response.data.data?.amount ? response.data.data.amount / 100 : 0,
          merchantTransactionId: merchantTransactionId,
          state: response.data.data?.state || 'FAILED',
          responseCode: response.data.code,
          rechargeMethod: "PhonePe",
          rechargeDate: new Date(),
          transactionId: merchantTransactionId
        };

        wallet.recharges.push(failedRecharge);
        await wallet.save();
      }

      return res.status(400).send({
        success: false,
        message: "Payment validation failed",
        data: response.data
      });
    }
  } catch (error) {
    console.error("Error in payment validation:", error);
    return res.status(500).send({ error: "Payment validation failed" });
  }
};
