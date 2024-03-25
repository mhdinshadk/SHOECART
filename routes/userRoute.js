const express = require('express'); 
const path = require("path");
const userController = require("../controllers/userController")
const session = require('express-session'); 
const config = require('../config/confiq');
const cartController = require("../controllers/cartController"); 
const profileController = require("../controllers/profileController");
const userAuth = require("../middileware/userAuth");
const cartLength = require("../middileware/cartMiddleware");
const orderController = require("../controllers/orderController"); 
const couponController = require("../controllers/couponController");
const walletController = require("../controllers/walletController");
const wishlistController = require("../controllers/wishlistController");
const errorHandler =require('../middileware/errorHandler')
const {env} = require('process');


const user_route = express()

user_route.use(
	session({
		secret : config.sessionSecret,
		resave : false,
		saveUninitialized : true,
	})
);
user_route.use(cartLength)

//----------------set view engin -------------//
user_route.set('view engine','ejs');
user_route.set('views','./views/users');


user_route.use(express.json());
user_route.use(express.urlencoded({ extended:true }));

//-------home page ------------\\
user_route.get("/",userController.loadHome);
user_route.get('/home',userController.loadHome);

//--------login,signup,logout ------------\\
user_route.get("/login",userAuth.isLogout, userController. loadLogin);
user_route.post("/login", userAuth.isLogout, userController. verifyLogin);
user_route.get("/signup", userAuth.isLogout, userController.loadRegister);
user_route.post("/signup", userAuth.isLogout, userController.insertUser);
user_route.get("/otp", userAuth.isLogout, userController.loadOtpPage);
user_route.post("/otp", userAuth.isLogout, userController.verifyOtp);
user_route.get('/logout',userAuth.isLogin,userController.userLogout);
user_route
// ------------ signup routes --------------- \\
user_route.get('/signup',userController.loadRegister);
user_route.post('/signup',userController.verifyOtp);
user_route.get('/otp',userController.loadOtpPage);
user_route.post('/otp',userController.insertUser);
user_route.post('/resendOtp', userController.resendOtp); 
//------------ product route --------------------\\
user_route.get('/products', userController.loadProducts);
user_route.get('/productDetails/:id', userController.loadProductDetails);

//------------- Cart routes -----------------------\\

user_route.get("/cart", cartController.loadCart);
user_route.post("/addTocart",cartController.addToCart);
user_route.post("/cart-quantity", cartController.cartQuantity);
user_route.post("/remove-product", cartController.removeProduct)


// ================ user profile routes ================
user_route.get('/userProfile',userAuth.isLogin,profileController.loadProfile);
user_route.get('/address',userAuth.isLogin,profileController.loadAddress);
user_route.post('/addAddress',userAuth.isLogin,profileController.addAddress);
user_route.get('/editAddress',userAuth.isLogin,profileController.loadEditAddress);
user_route.post('/editAddress',userAuth.isLogin,profileController.editAddress);
user_route.delete('/deleteAddress',userAuth.isLogin, profileController.deleteAddress);
user_route.post('/updateUser',userAuth.isLogin,profileController.updateUser);
user_route.post('/resetPassword',userAuth.isLogin,profileController.resetPassword);
user_route.get('/coupon',userAuth.isLogin,profileController.loadCoupon);

//------------- order routes ----------------------\\
user_route.get('/checkout',userAuth.isLogin,orderController.loadCheckout);
user_route.post('/addShippingAddress',userAuth.isLogin,orderController.addShippingAddress);
user_route.post('/placeOrder',userAuth.isLogin,orderController.placeOrder);
user_route.get('/viewOrder',userAuth.isLogin,orderController.loadOrderPage);
user_route.get('/orderDetails',userAuth.isLogin,orderController.loadOrderDetailes);
user_route.post('/cancelOrder',userAuth.isLogin,orderController.cancelOrder);
user_route.post('/verifyPayment',userAuth.isLogin,orderController.verifyPayment);
user_route.post('/returnOrder', userAuth.isLogin, orderController. returnProduct);
user_route.get('/downloadInvoic',userAuth.isLogin,orderController.invoiceDownload);

// ========= wallet routes ==========
user_route.get('/wallet',userAuth.isLogin,walletController.loadWallet);
user_route.post('/addMoneyToWallet',userAuth.isLogin,walletController.addMoneyToWallet);
user_route.post('/verifyWalletpayment',userAuth.isLogin,walletController.verifyWalletPayment);

// ========= coupon routes ==========
user_route.post('/applyCoupon',userAuth.isLogin,couponController.couponCheck);
user_route.post('/removeCoupon',userAuth.isLogin,couponController.removeCoupon);

//======================== W I S H L I S T == S E C T I O N ============================================

user_route.get("/wishlist", userAuth.isLogin, wishlistController.loadWishlist);

user_route.post("/addToWishlist", wishlistController.addToWishlist);

user_route.get("/remove-wishlist", userAuth.isLogin, wishlistController.removeProduct);


// ========= error  page to handile=======
user_route.use(errorHandler); 

module.exports = user_route;