const mongoose = require("mongoose");
const Cart = require("../models/cart");
const Product = require("../models/product");
const User = require("../models/users");
const Address = require("../models/userAddress");
const Order = require("../models/order");


// cart items total 
const calculateTotalPrice = async (userId) => {
	try {
	  const cart = await Cart.findOne({ user: userId }).populate(
		"products.productId"
	  );
  
	  if (!cart) {
		console.log("User does not have a cart.");
	  }
  
	  let totalPrice = 0;
	  for (const cartProduct of cart.products) {
		const { productId, quantity } = cartProduct;
		if (productId.discountedPrice > 0) {
		  const productSubtotal = productId.discountedPrice * quantity;
		  totalPrice += productSubtotal;
		} else {
		  const productSubtotal = productId.price * quantity;
		  totalPrice += productSubtotal;
		}
	  }
  
	  return totalPrice;
	} catch (error) {
	  console.error("Error calculating total price:", error.message);
	  return 0;
	}
  };
  

  const loadCheckout = async (req, res, next) => {
	try {
	  const cartDetails = await Cart.findOne({ user: req.session.user_id })
		.populate({
		  path: "products.productId",
		  select: "productName price discountedPrice",
		})
		.exec();
  
	  if (cartDetails) {
		const total = await calculateTotalPrice(req.session.user_id);
		const userAddress = await Address.findOne(
		  { userId: req.session.user_id },
		  { address: 1 }
		);
		if (userAddress) {
		  return res.render("checkout", {
			user: req.session.user_id,
			total,
			address: userAddress.address,
			products: cartDetails.products,
		  });
		} else {
		  return res.render("checkout", {
			user: req.session.user_id,
			total,
			address: 0,
			products: cartDetails.products,
		  });
		}
	  } else {
		return res.redirect("/cart");
	  }
	} catch (error) {
	  next(error);
	}
  };
  

// =========== adding user address =========
const addShippingAddress = async (req, res, next) => {
	try {
	  let userAddress = await Address.findOne({ userId: req.session.user_id });
	  if (!userAddress) {
		userAddress = new Address({
		  userId: req.session.user_id,
		  address: [
			{
			  fullName: req.body.fullName,
			  mobile: req.body.mobile,
			  state: req.body.state,
			  district: req.body.district,
			  city: req.body.city,
			  pincode: req.body.pincode,
			},
		  ],
		});
	  } else {
		userAddress.address.push({
		  fullName: req.body.fullName,
		  mobile: req.body.mobile,
		  state: req.body.state,
		  district: req.body.district,
		  city: req.body.city,
		  pincode: req.body.pincode,
		});
	  }
  
	  let result = await userAddress.save();
  
	  res.redirect("/checkout");
	} catch (error) {
	  next(error);
	}
  };
  //---------------- generate order uniq id -------------------\\
  const generateUniqueTrackId = async () => {
	try {
	  let orderID;
	  let isUnique = false;
  
	  // Keep generating order IDs until a unique one is found
	  while (!isUnique) {
		// Generate a random 6-digit number
		orderID = Math.floor(100000 + Math.random() * 900000);
  
		// Check if the order ID already exists in the database
		const existingOrder = await Order.findOne({ orderID });
  
		// If no existing order with the same orderID is found, it's unique
		if (!existingOrder) {
		  isUnique = true;
		}
	  }
  
	  return orderID;
	} catch (error) {
	  console.log(error.message);
	}
  };
  //--------------- place order --------------------\\
  const placeOrder = async (req,res,next) => {
	try {
		const userId  = req.session.user_id;
		const addressId = req.body.address;
		const paymentType = req.body.payment;
		const totalAmount = parseInt(req.body.amount);
		const cartDetails = await Cart.findOne({ user : userId});

		const userAddrs = await Address.findOne({userId:userId});
		const shipAddress = userAddrs.address.find((address) => {
			return address._id.toString() === addressId.toString();
		});

		if(!shipAddress) {
			return res.status(400).json({error : "Address not found"});
		}
		const user = await User.findById(req.session.user_id);

		// checking product in stock 
		 const productQuantity = await checkProductQuantities(userId);
		 if(productQuantity === false) {
			return res.status(202).send({});
		 }

		 let total = await calculateTotalPrice(userId);
            // total = total - discountTotal;

		const { fullName, mobile, state, district, city, pincode } = shipAddress;

		const productIDs = cartDetails.products.map(
			(productItem) => productItem.productId
		);

		const productPrices = []; // Array to store product prices

		const productData = await Cart.find({
		  "products.productId": { $in: productIDs },
		})
		  .populate({
			path: "products.productId",
			select: "price discountedPrice",
		  })
		  .exec();

		  if (productData && productData.length > 0) {
			productData.forEach((order) => {
			  if (order.products && order.products.length > 0) {
				order.products.forEach((product) => {
				  const price =
					product.productId.discountedPrice || product.productId.price;
				  productPrices.push(price); // Store the price in the array
				});
			  } else {
				console.log("Products array is empty in the order");
			  }
			});
		  } else {
			console.log("No matching orders found");
		  }
		   // Now update the cartProducts with prices
		   const cartProducts = cartDetails.products.map((productItem, index) => ({
			productId: productItem.productId,
			quantity: productItem.quantity,
			OrderStatus: "Pending",
			StatusLevel: 1,
			price: productPrices[index], // Use the corresponding price from the array
			paymentStatus: "Pending",
			"returnOrderStatus.status": "none",
			"returnOrderStatus.reason": "none",
		  }));
		  const today = new Date();
		  const deliveryDate = new Date(today);
		  deliveryDate.setDate(today.getDate() + 7);


		  const trackId = await generateUniqueTrackId();
		  const order = new Order({
			userId: req.session.user_id,
			"shippingAddress.fullName": fullName,
			"shippingAddress.mobile": mobile,
			"shippingAddress.state": state,
			"shippingAddress.district": district,
			"shippingAddress.city": city,
			"shippingAddress.pincode": pincode,
			products: cartProducts,
			totalAmount: total,
			paymentMethod: paymentType,
			expectedDelivery: deliveryDate,
			orderDate: new Date(),
			trackId,
			// coupon: appliedCoupon,
		  });

		  const placeorder = await order.save();
		  const orderId = placeorder._id;


		  
		  if (paymentType === "COD") {
			for (const item of cartDetails.products) {
			  const productId = item.productId._id;
			  const quantity = parseInt(item.quantity, 10);
		
				await Product.findByIdAndUpdate(
				  { _id: productId },
				  {
					$inc: { quantity: -quantity },
				  }
				);
			  }
		
			  res
				.status(200)
				.json({ placeorder, message: "Order placed successfully" });

				await Cart.findOneAndDelete({ userid: req.body.user_id });
			} 
	} catch (error) {
		next(error);
	}
  };

  
// ========= Function to Checkout product Stock Check =========
const checkProductQuantities = async (userId) => {
	const cart = await Cart.findOne({ user: userId }).populate(
	  "products.productId"
	);
  
	for (const item of cart.products) {
	  const productId = item.productId._id;
	  const product = await Product.findById(productId);
  
	  if (!product || item.quantity > product.quantity) {
		return false;
	  }
	}
	return true;
  };
  
// =========== rendering order history page user side ============
const loadOrderPage = async (req, res, next) => {
	try {
	  const userId = req.session.user_id;
	  const cart = await Cart.findOne({ user: userId });
	  const userData = await User.findById({ _id: userId });
  
	  const orderData = await Order.find({ userId: userId }).sort({
		orderDate: -1,
	  });
  
	  res.render("orders", { user: userData, orders: orderData });
	} catch (error) {
	  next(error);
	}
  };
  //------------- load order details ----------------------\\
  const loadOrderDetailes = async (req, res, next) => {
	try {
	  const userId = req.session.user_id;
	  const orderId = req.query.id;
  
	  let order; // Declare order variable outside the if-else block
  
	  if (orderId) {
		order = await Order.findOne({ _id: orderId })
		  .populate({
			path: "products.productId",
		  })
		  .sort({ orderDate: -1 });
	  } else {
		order = await Order.findOne({ userId: userId })
		  .populate({
			path: "products.productId",
		  })
		  .sort({ orderDate: -1 });
	  }
  
	  const products = await Cart.findOne({ user: userId }).populate(
		"products.productId"
	  );
  
	  if (!order) {
		return res.status(404).json({
		  success: false,
		  message: "No orders found for the user.",
		});
	  }
  
	  res.render("orderDetails", { order, products, user: req.session.user_id });
	} catch (err) {
	  next(err);
	}
  };

  //-------------- load admin order page ---------------------\\

  const loadAdminOrder = async (req, res, next) => {
	try {
		const orders = await Order.find();

		const productWiseOrdersArray = [];

		for (const order of orders) {
			for(const productInfo of order.products ) {
				const productId = productInfo.productId;

				const product = await Product.findById(productId).select(
					"ProductName images price"
				);
				
				const userDetails = await User.findById(order.userId).select("email");

				if (product) {
					 // Push the order details with product details into the array
					 productWiseOrdersArray.push({
						user: userDetails,
						product: product,
						orderDetails: {
							_id:order._id,
							userId:order.userId,
							shippingAddress: order.shippingAddress,
							orderDate: order.orderDate,
							totalAmount: productInfo.quantity * productInfo.price,
							OrderStatus: productInfo.OrderStatus,
							StatusLevel: productInfo.StatusLevel,
							paymentStatus: productInfo.paymentStatus,
							paymentMethod: order.paymentMethod,
							quantity: productInfo.quantity,
						  },
					 });
				}
			}
		}

		res.render("order", {orders : productWiseOrdersArray});

	} catch (error) {
		next(error);
	}
  };

  // ----------------- admin sidede order managment ----------- \\
  const orderMangeLoad = async (req,res,next) => {
	try{
		const {orderId,productId} = req.query;

		const order = await Order.findById(orderId);

		if(!order) {
			return res.status(404).render("error-404");
		}

		const productInfo = order.products.find(
			(product)=> product.productId.toString() === productId
		);
		
		const product = await Product.findById(productId).select(
			"productName images price"
		);

		const productOrder = {
			orderId : order._id,
			product : product,
			orderDetails : {
				_id : order._id,
				userId : order.userId,
				shippingAddress : order.shippingAddress,
				orderDate : order.orderDate,
				totalAmount : order.totalAmount,
				OrderStatus : productInfo.OrderStatus,
				StatusLevel : productInfo.StatusLevel,
				paymentMethod : order.paymentMethod,
				paymentStatus : productInfo.paymentStatus,
				quantity : productInfo.quantity,
				price : productInfo.price,
			},
		};
		res.render("orderManagment",{ product: productOrder, orderId, productId });

	} catch (error) {
		next (error)
	}
  };
  
  // ----------- user side cancell order ----------------- \\
  const cancelOrder = async (req, res, next) => {
	try {
	  const orderId = req.body.orderId;
	  const productId = req.body.productId;
  
	  const order = await Order.findById(orderId);
  
	  if (!order) {
		return res.status(404).json({ message: "Order not found." });
	  }
  
	  const productInfo = order.products.find(
		(product) => product.productId.toString() === productId
	  );
  
	  // const productDetails = await Product.findById(productInfo.productId);
	  let totalAmount = productInfo.quantity * productInfo.price;
  
	  let cartTotal = order.totalAmount;
  
	  if (order) {
		let totalWithoutCoupon = order + cartTotal;
  
		if (Math.abs(totalAmount)) {
		  totalWithoutCoupon = await order.products.reduce(
			async (totalPromise, product) => {
			  const total = await totalPromise;
			  if (
				product.productId._id.toString() !== productId &&
				product.OrderStatus !== "Cancelled"
			  ) {
				const productDetailsWithoutCancelled = await Product.findById(
				  product.productId
				);
				return (
				  total + productDetailsWithoutCancelled.price * product.quantity
				);
			  }
			  return total;
			},
			Promise.resolve(0)
		  );
  
		  totalAmount = cartTotal - totalWithoutCoupon;
		}
	  }
  
	  productInfo.OrderStatus = "Cancelled";
	  productInfo.updatedAt = Date.now();
  
	  await Promise.all([
		order.save(),
		Product.findByIdAndUpdate(
		  { _id: productId },
		  { $inc: { quantity: productInfo.quantity } }
		),
	  ]);
  
	  res.json({ cancel: 1 });
	} catch (error) {
	  next(error);
	}
  };

 
// =========== admin side order status managment ============
const changeOrderStatus = async (req, res, next) => {
	try {
	  const { status, orderId, productId } = req.body;
	  const order = await Order.findById(orderId);
	  // find status level
	  const statusMap = {
		Shipped: 2,
		OutforDelivery: 3,
		Delivered: 4,
	  };
  
	  const selectedStatus = status;
	  const statusLevel = statusMap[selectedStatus];
  
	  if (!order) {
		return res.status(404).json({ message: "Order not found." });
	  }
	  // Find the product within the order by its ID (using .toString() for comparison)
	  const productInfo = order.products.find(
		(product) => product.productId.toString() === productId
	  );
  
	  productInfo.OrderStatus = status;
	  productInfo.StatusLevel = statusLevel;
	  productInfo.updatedAt = Date.now();
  
	  if (status === "Delivered") productInfo.paymentStatus = "Success";
  
	  const result = await order.save();
  
	  res.redirect(
		`/admin/order/orderManagment?orderId=${orderId}&productId=${productId}`
	  );
	} catch (error) {
	  next(error);
	}
  };
  
  
  
  // ========= admin cancel order ==========
  const adminCancelOrder = async (req, res, next) => {
	try {
	  const { orderId, productId } = req.body;
  
	  const order = await Order.findById(orderId).populate("userId");
  
	  const userId = order.userId._id;
  
	  if (!order) {
		return res.status(404).json({ message: "Order not found." });
	  }
  
	  const productInfo = order.products.find(
		(product) => product.productId.toString() === productId
	  );
  
	  const totalAmount = productInfo.quantity * productInfo.price;
  
	  if (productInfo) {
		productInfo.OrderStatus = "Cancelled";
		productInfo.updatedAt = Date.now();
  
		await order.save();
  
		await Product.findByIdAndUpdate(
		  { _id: productId },
		  {
			$inc: { quantity: productInfo.quantity },
		  }
		);
  
		return res.json({ cancel: 1, message: "Order successfully cancelled" });
	  } else {
		return res
		  .status(404)
		  .json({ message: "Product not found in the order." });
	  }
	} catch (error) {
	  next(error);
	}
  };
	module.exports = {
		loadCheckout,
		addShippingAddress,
		placeOrder,
		loadOrderPage,
		loadOrderDetailes,
		loadAdminOrder,
		orderMangeLoad,
		cancelOrder,
		changeOrderStatus,
		adminCancelOrder,
		
	}