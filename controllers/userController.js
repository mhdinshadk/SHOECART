const User = require("../models/users");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const path = require("path");
const Product = require("../models/product");
const  Category = require("../models/category")
const otpGenerator = require("otp-generator");
const {ObjectId} = require("mongodb");
const { log } = require("console");
const category = require("../models/category");
const mongoose = require('mongoose');


//---------- password security ------------\\
const securePassword = async (password) => {
	try{
		const passwordHash = await bcrypt.hash(password,10);
		return passwordHash;
	}catch (error) {
		console.log(error.message);
	}
};
//------------------- sending mail to user--------------\\

const otpSend = async (Fname, email, otp) => {
	try {
	  const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 587,
		auth: {
		  user: "aljamalu2002@gmail.com",
		  pass:"xife zrrd vobc yfhb"
		}
	  })
	  // Email message
	  const mailOptions = {
		from: 'aljamalu2002@gmail.com',
		to: email,
		subject: 'OTP Verification',
		html: `
		<!DOCTYPE html>
		<html>
		<head>
		  <style>
			/* Add some basic styling to the email for a better user experience */
			body {
			  font-family: Arial, sans-serif;
			  display: flex;
			  justify-content: center; /* Center horizontally */
			  align-items: center; /* Center vertically */
			  height: 100vh; /* Set the body to full viewport height */
			}
			.otp-container {
			  background-color: #f4f4f4;
			  padding: 20px;
			  border-radius: 10px;
			  display: inline-block;
			}
			.otp-label {
			  color: green; /* Add the green color to the label */
			}
		  </style>
		</head>
		<body>
		  <div>
			<h1>OTP Verification</h1>
			<p><span class="otp-label">Hi, <b>'+firstName+ '</b> Your OTP is:</span></p>
			<div class="otp-container">
			  <h2>${otp}</h2>
			</div>
		  </div>
		</body>
		</html>
		
	  `
	  }
	  // Send the email
	  transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
		  console.log('error sending email', error)
		} else {
		  console.log('Email sent: ' + info.response)
		}
	  })
	} catch (error) {
	  console.log(error)
	  res.render('500')
	}
  }
  

  //------------- Load otp page  -------------\\
const loadOtpPage = async (req,res,next) => {
	try{
		res.render('otp');
	} catch (error) {
		next(error);
	}
};


//-----------otp verification and otp storing in session ----------------\\
const verifyOtp = async (req, res) => {
	try {
		console.log('jhhjhghghj')
	  const currentTime = Date.now() / 1000
	//   console.log('bodytpp',req.body.otp);
	//   console.log('hfdhdfh',req.session.otp.code);
	  if (
		req.body.otp === req.session.otp.code &&
		currentTime <= req.session.otp.expire
	  ) {
		const user = await User({
		  firstName: req.session.firstname,
		  lastName: req.session.lastname,
		  email: req.session.email,
		  mobile: req.session.mobile,
		  password: req.session.password,
		  isVerified: 1
		})
		const result = await user.save()
		res.json({ success: true})
		
	  } else {
		res.json({ success: false, message: 'Invalid OTP' })
	  }
	} catch (error) {
	  console.log(error)
	  res.render('500')
	}
  }
  
  
  //-------------------- Resend The OTP After The Time ---------------\\

  const resendOtp = async (req, res, next) => {
    try {
        const currentTime = Date.now() / 1000;
        if (req.session.otp.expiry != null) {
            if (currentTime > req.session.otp.expiry) {
                const newDigit = otpGenerator.generate(6, {
                    digits: true,
                    alphabets: false,
                    specialChars: false,
                    upperCaseAlphabets: false,
                    lowerCaseAlphabets: false,
                });
                req.session.otp.code = newDigit;
                const newExpiry = currentTime + 60;
                req.session.otp.expiry = newExpiry;
                
                // Add a log to check if the email is being sent
                console.log("Sending verification email...");
                sendVerificationEmail(req.session.email, req.session.otp.code);

                // Log success
                console.log("OTP has been sent successfully");

                res.render("otp", { message: "OTP has been sent to your email" });
            } else {
                res.render("otp", {
                    message: "You can request a new OTP after the old OTP expires",
                });
            }
        } else {
            res.send("Please register again");
        }
    } catch (error) {
        // Log errors
        console.error("Error in resendOtp:", error);
        next(error);
    }
};



  

//---------- insert user in database -------------------\\
const insertUser = async (req, res) => {
	try {
	  const otpDigit = otpGenerator.generate(6, {
		digits: true,
		alphabets: false,
		specialChars: false,
		upperCaseAlphabets: false,
		lowerCaseAlphabets: false
	  })
  
	  const creationTime = Date.now() / 1000
	  const expirationTime = creationTime + 30
	  const userCheckMobile = await User.findOne({ mobile: req.body.phonenumber })
	  const userCheck = await User.findOne({ email: req.body.email })
	  let emailError = ''
	  let mobileError = ''
  
	  if (userCheck) {
		emailError = 'Email is already in use.'
	  }
  
	  if (userCheckMobile) {
		mobileError = 'Mobile number is already in use.'
	  }
  
	  if (emailError || mobileError) {
		res.json({ emailError, mobileError })
	  } else {
		const spassword = await securePassword(req.body.password)
		req.session.firstname = req.body.firstname
		req.session.lastname = req.body.lastname
		req.session.email = req.body.email
		req.session.mobile = req.body.phonenumber
		if (
		  req.body.firstname &&
		  req.body.email &&
		  req.body.lastname &&
		  req.body.password
		) {
		  if (req.body.password === req.body.confirm_password) {
			req.session.password = spassword
			req.session.otp = {
			  code: otpDigit,
			  expire: expirationTime
			}
			 otpSend(req.session.name, req.session.email, req.session.otp.code)
		  } else {
			res.json({ message: "Password doesn't match" })
		  }
		} else {
		  res.json({ message: 'Please enter all details' })
		}
		res.render('otp')
	  }
	} catch (error) {
	  console.log(error)
	  res.render('500')
	}
  }


  
//---------- user Login -------------\\

const loadLogin = async (req,res,next) =>{
	try{
		res.render('login');
	}catch (error){
		next(error)
	}
};

//--------------------- verify login ------------------\\
const verifyLogin = async (req, res,next) => {
try {
    const Email = req.body.email;
    const Password = req.body.password;

    const userData = await User.findOne({ email: Email });
    if (userData) {
      if (userData.isBlock == false) {
        const passwordMatch = await bcrypt.compare(Password, userData.password);

        if (passwordMatch) {
          if (userData.isVerified == false) {
            res.render("login", { message: "please verify your mail" });
          } else {
            req.session.user_id = userData._id;

            res.redirect("/");
          }
        } else {
          res.render("login", { message: "Email or password is incorrect" });
        }
      } else {
        res.render("login", { message: "This User is blocked" });
      }
    } else {
      res.render("login", { message: "Email or password is incorrect" });
    }
  } catch (error) {
    next(error);
  }
};
  // ----------------user logout-------------\\
const userLogout = async (req,res,next) => {
	try{
		req.session.user_id = null;
		res.render('login');
	}catch (error) {
		next(error);
	}
};
 


// ======== rendering home page ========
const loadHome = async (req, res, next) => {
	try {
	  const categoryDetails = await Category.find({});
	  const products = await Product.find({})
		.populate("category");
	  res.render("home", {
		catData: categoryDetails,
		product: products,
		user: req.session.user_id,
	
	  });
	} catch (error) {
	  next(error);
	}
  };
  

// ---------- load product page ------------\\
const loadProducts = async (req, res, next) => {
	try {
	  let perPage = 4; // Number of products per page
	  let page = parseInt(req.query.page) || 1;
	  const categoryDetails = await Category.find({});
	  const totalProducts = await Product.countDocuments({ status: true });
  
	  if (totalProducts === 0) {
		perPage = -12;
	  }
  
	  const totalPages = Math.ceil(totalProducts / perPage);
	  const brands = await Product.aggregate([{ $group: { _id: "$brand" } }]);
  
	  let search = "";
  
	  if (req.query.search) {
		search = req.query.search;
	  }
  
	  const query = {
		status: true,
		$or: [
		  { name: { $regex: new RegExp(search, "i") } },
		  { brand: { $regex: new RegExp(search, "i") } },
		  { productName: { $regex: new RegExp(search, "i") } },
		],
		price: { $gte: req.query.minPrice || 1, $lte: req.query.maxPrice || 20000 },
	  };
  
	  if (page < 1) {
		page = 1;
	  } else if (page > totalPages) {
		page = totalPages;
	  }
  
	  if (req.query.category) {
		query.category = req.query.category;
	  }
  
	  if (req.query.brand) {
		query.brand = req.query.brand;
	  }
  
	  let sortValue = req.query.sortValue === "2" ? 1 : -1;
	  let defaultSortKey = req.query.sortValue !== "3" ? "price" : "createdAt";
  
	  let products = await Product.find(query)
		.populate("category")
		.sort({ [defaultSortKey]: sortValue })
		.limit(perPage)
		.skip((page - 1) * perPage);
  
	  res.render("product", {
		catData: categoryDetails,
		product: products,
		currentPage: page,
		pages: totalPages,
		user: req.session.user_id,
		brand: req.query.brand,
		sortValue: req.query.sortValue,
		minPrice: req.query.minPrice,
		maxPrice: req.query.maxPrice,
		search: req.query.search,
		category: req.query.category,
		brands,
	  });
	} catch (error) {
	  next(error);
	}
  };
  
  //------------- loading productDetails ------------------------\\
  const loadProductDetails = async (req, res, next) => {
	try {
	  const { id } = req.params;
  
	  // Validate if 'id' is a valid ObjectId
	  if (!mongoose.Types.ObjectId.isValid(id)) {
		// Handle the case where 'id' is not a valid ObjectId
		return res.status(400).send('Invalid ObjectId');
	  }
  
	  // Use mongoose.Types.ObjectId directly in the query
	  const product = await Product.findById({ _id:new mongoose.Types.ObjectId(id) })
		.populate("category");
  
	  res.render("productDetails", {
		user: req.session.user_id,
		product: product,
	  });
	} catch (error) {
	  next(error);
	}
  };
  
  
  
  
//------------ user Signup ------------------\\

  const loadRegister = async (req,res,next) => {
	try{
		res.render('signup');
	}catch (error) {
		next(error);
	}
  };


  //-------- laoding homepage ------------\\

  const verifLoadHome = async (req,res,next) =>{
	try{
		const Email = req.body.email;
		const Password = req.body.password;

		const userData = await User.findOne({emial: Email});
		if(userData) {
			if(userData.isBlock == false){
				const passwordMatch = await bcrypt.compare(Password,userData.password);

				if(passwordMatch) {
					if(userData.isVerified == false) {
						res.render("login", {message : "please verify your mail"});
					}else {
						req.session.user_id = userData._id;

						res.redirect('/');
					}
				}else {
					res.render("login", {message : "Email or password is incoreect"});
				}
			}else {
				res.render("login", {message:"This User is blocked"});
			}
		}else {
			res.render("login", {message :"Email or Password is incorrected"});
		}
	}catch (error) {
		next(error);
	}
  };



module.exports = {
  loadLogin,
  loadRegister,
  insertUser,
  verifyOtp,
  loadHome,
  verifLoadHome,
  verifyOtp,
  resendOtp,
  loadOtpPage,
  verifyLogin,
  userLogout,
  loadProducts,
  loadProductDetails

  };
