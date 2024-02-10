const mongoose = require("mongoose");
const Offer = require("../models/offer");
const Product = require("../models/product");
const Category = require("../models/category");

// ---------------- loading the add offer ----------\\

// ======= loading the add product page =========
const loadAddOffer = async (req, res, next) => {
	try {
	  res.render("addOffer");
	} catch (error) {
	  next(error);
	}
  };
  
  
  
  // ========== adding new offers =========
  const addOffer = async (req, res, next) => {
	try {
	  const { startingDate, expiryDate, percentage } = req.body;
	  const name = req.body.name;
	  const offerExist = await Offer.findOne({ name: name });
	  if (offerExist) {
		res.render("addOffer", { message: "Offer already existing" });
	  } else {
		const offer = new Offer({
		  name: name,
		  startingDate: startingDate,
		  expiryDate: expiryDate,
		  discount: percentage,
		});
		await offer.save();
		res.redirect("/admin/offer");
	  }
	} catch (error) {
	  next(error);
	}
  };
  
  
  
  // ======= rendering the home page =======
  const loadOffers = async (req, res, next) => {
	try {
	  const offers = await Offer.find();
	  res.render("offer", {
		offers: offers,
		now: new Date(),
	  });
	} catch (error) {
	  next(error);
	}
  };

  // ---------------- load editOffer --------------------\\
  const loadEditOffer = async (req,res,next) => {
	try {
		const id = req.params.id;
		const offer = await Offer.findOne({_id:id});
		res.render("editOffer",{
			offer: offer,
		});
	} catch (error) {
		next(error);
	}
  };

  //---------- updating editData --------------\\
  const editOffer = async (req,res,next) => {
	try {
		const {id,name,startingDate,expiryDate,percentage} = req.body;
		await Offer.updateOne(
			 {_id :id},
			 {
				$set:{
					name:name,
					startingDate:startingDate,
					expiryDate:expiryDate,
					discount:percentage
				},
			 }
		);

		res.redirect("/admin/offer");
	} catch (error) {
		next(error);
	}
  };

  //------------- offer Canceling -------------\\
  const cancelOffer = async (req,res,next) => {
	try{
		const {offerId} = req.body;
		await Offer.updateOne(
			{_id:offerId},
			{
				$set: {
					status:false,
				},
			}
		);
	} catch (error) {
		next(error);
	}
  };




 module.exports= {
    loadAddOffer,
	addOffer,
	loadOffers,
	loadEditOffer,
	editOffer,
	cancelOffer,
 }
