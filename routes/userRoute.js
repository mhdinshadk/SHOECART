const express = require('express'); 
const path = require("path");
const userController = require("../controllers/userController")
const session = require('express-session'); 
const config = require('../config/confiq');
const cartController = require("../controllers/cartController"); 
const profileController = require("../controllers/profileController");
const userAuth = require("../middileware/userAuth");
const orderController = require("../controllers/orderController"); 
const {env} = require('process');


const user_route = express()

user_route.use(
	session({
		secret : config.sessionSecret,
		resave : false,
		saveUninitialized : true,
	})
);

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
user_route.get('/logout',userAuth.isLogin,userController.userLogout)
// ------------ signup routes --------------- \\
user_route.get('/signup',userController.loadRegister);
user_route.post('/signup',userController.verifyOtp);
user_route.get('/otp',userController.loadOtpPage);
user_route.post('/otp',userController.insertUser);
user_route.get('/resendOtp', userController.resendOtp); 
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

//------------- order routes ----------------------\\
user_route.get('/checkout',userAuth.isLogin,orderController.loadCheckout);
user_route.post('/addShippingAddress',userAuth.isLogin,orderController.addShippingAddress);
user_route.post('/placeOrder',userAuth.isLogin,orderController.placeOrder);
user_route.get('/viewOrder',userAuth.isLogin,orderController.loadOrderPage);
user_route.get('/orderDetails',userAuth.isLogin,orderController.loadOrderDetailes);
user_route.post('/cancelOrder',userAuth.isLogin,orderController.cancelOrder);


module.exports = user_route;