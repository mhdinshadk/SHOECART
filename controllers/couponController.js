const mongoose = require('mongoose');
const Coupon = require("../models/coupon");
const Cart = require("../models/cart");


// --------------- rendering coupon page --------------\\
const loadaddCoupon = async (req,res,next) => {
	try {
		res.render("addCoupon");
	} catch (error) {
		next(error);
	}
};