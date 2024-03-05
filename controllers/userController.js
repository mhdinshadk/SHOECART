const User = require("../models/users");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const path = require("path");
const Product = require("../models/product");
const  Category = require("../models/category")
const otpGenerator = require("otp-generator");
const {ObjectId} = require("mongodb");
const { log } = require("console");
const mongoose = require('mongoose');
const Offer = require("../models/offer");


//---------- password security ------------\\
const  securePassword = async (password) => {
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
		console.log(req.session.otp.code ,"______________________________")
        const currentTime = Date.now() / 1000;

        // Check if OTP is correct and not expired
        if (req.body.otp === req.session.otp.code && currentTime <= req.session.otp.expire) {
            // OTP is valid, proceed with user creation
            const user = await User.create({
                firstName: req.session.firstname,
                lastName: req.session.lastname,
                email: req.session.email,
                mobile: req.session.mobile,
                password: req.session.password,
                isVerified: true // Corrected the value to boolean true
            });

            // Save the new user
            await user.save();
            res.json({ success: true });
        } else {
            // Invalid OTP
            res.json({ success: false, message: 'Invalid OTP' });
        }
    } catch (error) {
        console.log(error);
        res.render('500'); // Render error page
    }
};


  //-------------------- Resend The OTP After The Time ---------------\\

  const resendOtp = (req, res) => {
	try {
		console.log('haiiiiiii');
	  const currentTime = Date.now() / 1000
	  if (req.session.otp.expire != null) {
		if (currentTime > req.session.otp.expire) {
		  const newDigit = otpGenerator.generate(6, {
			digits: true,
			alphabets: false,
			specialChars: false,
			upperCaseAlphabets: false,
			lowerCaseAlphabets: false
		  })
		  req.session.otp.code = newDigit
		  const newExpiry = currentTime + 30
		  req.session.otp.expire = newExpiry
		  otpSend(req.session.firstname, req.session.email, req.session.otp.code)
		  res.render('otp', { message: `New OTP send into your mail` })
		} else {
		  res.render('otp', { message: `OTP send to into your mail` })
		}
	  } else {
		res.send('Already registered')
	  }
	} catch (error) {
	  console.log(error.message)
	  res.render('500')
	}
  }


  

  

//---------- insert user in database -------------------\\
const insertUser = async (req, res, next) => {
    try {
        const otpDigit = otpGenerator.generate(6, {
            digits: true,
            alphabets: false,
            specialChars: false,
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false
        });

        const creationTime = Date.now() / 1000;
        const expirationTime = creationTime + 30;

        const userCheckMobile = await User.findOne({ mobile: req.body.phonenumber });
        const userCheck = await User.findOne({ email: req.body.email });
        let emailError = '';
        let mobileError = '';

        if (userCheck) {
            emailError = 'Email is already in use.';
        }

        if (userCheckMobile) {
            mobileError = 'Mobile number is already in use.';
        }

        if (emailError || mobileError) {
            res.json({ emailError, mobileError });
        } else {
            const spassword = await securePassword(req.body.password);
            req.session.firstname = req.body.firstname;
            req.session.lastname = req.body.lastname;
            req.session.email = req.body.email;
            req.session.mobile = req.body.phonenumber;

            if (
                req.body.firstname &&
                req.body.email &&
                req.body.lastname &&
                req.body.password
            ) {
                if (req.body.password === req.body.confirm_password) {
                    req.session.password = spassword;
                    req.session.otp = {
                        code: otpDigit,
                        expire: expirationTime
                    };
                    // Send OTP to the user's email
                    otpSend(req.session.name, req.session.email, req.session.otp.code);

                    res.render('otp');
                } else {
                    res.json({ message: "Password doesn't match" });
                }
            } else {
                res.json({ message: 'Please enter all details' });
            }
        }
    } catch (error) {
        console.log(error);
        res.render('500');
    }
};




  
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
  
	  let search = "";
  
	  if (req.query.search) {
		search = req.query.search;
	  }
  
	  async function getCategoryIds(search) {
		const categories = await Category.find({
		  name: { $regex: ".*" + search + ".*", $options: "i" },
		});
		return categories.map((category) => category._id);
	  }
  
	  let minPrice = 1;
	  let maxPrice = 20000;
  
	  if (req.query.minPrice) {
		minPrice = req.query.minPrice;
	  }
	  if (req.query.maxPrice) {
		maxPrice = req.query.maxPrice;
	  }
  
	  const query = {
		status: true,
		$or: [
		  { name: { $regex: ".*" + search + ".*", $options: "i" } },
		  { brand: { $regex: ".*" + search + ".*", $options: "i" } },
		  { productName: { $regex: ".*" + search + ".*", $options: "i" } },
		],
		price: { $gte: minPrice, $lte: maxPrice },
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
  
	  let sortValue = -1;
	  if (req.query.sortValue) {
		if (req.query.sortValue === "2") {
		  sortValue = 1;
		} else if (req.query.sortValue === "1") {
		  sortValue = -1;
		} else {
		  sortValue = -1;
		}
	  }
  
	  let products;
	  if (req.query.sortValue && req.query.sortValue != 3) {
		products = await Product.find(query)
		  .populate("category")
		  .populate("offer")
		  .sort({ price: sortValue })
		  .limit(perPage)
		  .skip((page - 1) * perPage);
	  } else {
		products = await Product.find(query)
		  .populate("category")
		  .populate("offer")
		  .sort({ createdAt: sortValue })
		  .limit(perPage)
		  .skip((page - 1) * perPage);
	  }
  
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
	  const product = await Product.findById({ _id:new mongoose.Types.ObjectId(id) }).populate("offer")
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
// ======= loading coupon in user profile =======
const loadCoupon = async (req, res, next) => {
	try {
	  const user = req.session.user_id;
	  const couponData = await Coupon.find();
	  res.render("coupon", { couponData, user });
	} catch (err) {
	  next(err);
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
  loadProductDetails,
  loadCoupon ,

  };
