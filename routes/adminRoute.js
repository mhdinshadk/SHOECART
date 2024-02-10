const express = require('express'); 
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const config = require('../config/confiq');
const auth = require('../middileware/adminAuth');
const offerController = require("../controllers/offerController"); 
const salesController = require("../controllers/reportController"); 
const fileUploadMiddleware = require('../middileware/fileUpload');
const adminController  = require('../controllers/adminController');
const orderController = require("../controllers/orderController");

const admin_route = express();

admin_route.use(
	session({
		secret: config.sessionSecret,
		resave:false,
		saveUninitialized:true,
	})
);

//----------- setting view engin-----------\\
admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended : true }));

admin_route.use(express.static('public'));

// ------------- login,logout ---------------------\\
admin_route.get('/',auth.isLogout,adminController.loadLogin);
admin_route.post('/',adminController.verifyLogin);
admin_route.get('/logout',auth.isLogin,adminController.adminLogout);


//---------------------------- dashboard -----------------\\
admin_route.get('/dashboard',auth.isLogin,adminController.loadadHome);

//---------------- user routes -----------------\\
admin_route.get('/users',auth.isLogin,adminController.userLoad);
admin_route.get('/blockUsers',auth.isLogin,adminController.blockUser);

// ============== categories routes ================
admin_route.get('/addCategories',auth.isLogin,adminController.loadAddCategories);
admin_route.post('/addCategories',adminController.insertCategory);
admin_route.get('/viewCategories',auth.isLogin,adminController.loadViewCategory);
admin_route.get('/editCategory',auth.isLogin,adminController.loadEditCatogories);
admin_route.post('/updateCategory',adminController.editCategory);
admin_route.get('/unlistCategory',auth.isLogin,adminController.unlistCategory);


// ============== products routes ================
admin_route.get('/addProduct',auth.isLogin,adminController.loadaddProducts);
admin_route.post('/addProduct',fileUploadMiddleware.upload.array('images'), adminController.addProduct);
admin_route.get('/viewProduct',auth.isLogin,adminController.loadViewProducts);
admin_route.get('/editProduct',auth.isLogin,adminController.loadEditProduct);
admin_route.post('/editProduct',fileUploadMiddleware.upload.array('images'),adminController.editProduct);
admin_route.get('/unlistProduct',auth.isLogin,adminController.unlistProduct);

// -------------- sales report routes -----------------\\
admin_route.get('/salesReport',auth.isLogin,salesController.salesReportPageLoad )

//------------- order managment route ------------------\\
admin_route.get('/order',auth.isLogin,orderController.loadAdminOrder);
admin_route.get('/order/orderManagment',auth.isLogin,orderController. orderMangeLoad );
admin_route.post('/order/orderManagment/changeStatus',auth.isLogin,orderController. changeOrderStatus );
admin_route.post('/adminCancelOrder', auth.isLogin, orderController.adminCancelOrder);

//----------- offer routes ---------------------\\
admin_route.get('/addOffer',auth.isLogin,offerController.loadAddOffer);
admin_route.post('/addOffer',auth.isLogin,offerController.addOffer);
admin_route.get('/offer',auth.isLogin,offerController.loadOffers);
admin_route.get('/editOffer/:id',auth.isLogin,offerController.loadEditOffer)
admin_route.post('/editOffer',auth.isLogin,offerController.editOffer)
admin_route.patch('/cancelOffer',auth.isLogin,offerController.cancelOffer)

module.exports = admin_route;