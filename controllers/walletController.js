const User = require("../models/users");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// =========== razorpay instance =========== \\
var instance = new Razorpay({
	key_id: process.env.Razorpaykey_id,
	key_secret: process.env.Razorpaykey_secret,
  });

// ----------- loading wallet page -----------\\

const loadWallet = async (req,res,next) => {
	try{
		const user = req.session.user_id;
		const userData = await User.findOne({_id : user});

		res.render("wallet",{user,userData});
	} catch (error) {
		next(error);
	}
};

// ------------ adding Money to Wallet -------------\

const addMoneyToWallet = async (req, res, next) => {
	try {
	  const { amount } = req.body;
	  const id = crypto.randomBytes(8).toString("hex");
  
	  var options = {
		amount: amount * 100,
		currency: "INR",
		receipt: "" + id,
	  };
  
	  instance.orders.create(options, (err, order) => {
		if (err) {
		  res.json({ status: false });
		} else {
		  res.json({ status: true, payment: order });
		}
	  });
	} catch (error) {
	  next(error);
	}
  };

// ---------- veriying and adding wallet details to db ------\\

const verifyWalletPayment = async (req,res,next) => {
	try{
		const userId = req.session.user_id;
		const details = req.body;
		const amount = parseInt(details.order.amount)/100;
		let hmac = crypto.createHmac("sha256",instance.key_secret);

		hmac.update(
			details.payment.razorpay_order_id +
			 "|" + 
			 details.payment.razorpay_payment_id
		);
		hmac = hmac.digest("hex");
		if(hmac == details.payment.razorpay_signature) {
			const walletHistory = {
				transactionDate: new Date(),
				transactionDetails: "Deposited via Razorpay",
				transactionType: "Credit",
				transactionAmount: amount,
				currentBalance: !isNaN(userId.wallet) ? userId.wallet + amount : amount,
			  };
			  await User.findByIdAndUpdate(
				{_id:userId},
				{
					$inc: {
						wallet:amount,
					},
					$push: {
						walletHistory,
					}
				}
			  );

			  res.json({ status: true});
		} else {
			res.json({ status: false });
		}
	} catch (error) {
		next(error)
	}
};

module.exports = {
	loadWallet,
	addMoneyToWallet,
	verifyWalletPayment,
};