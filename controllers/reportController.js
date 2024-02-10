const mongoose = require("mongoose");
const ProductDB = require('../models/product');
const OrderDB = require("../models/order");
const User = require("../models/users");
const ExcelJS = require("exceljs");


// ---------------- loading salesReport page --------------\\
const salesReportPageLoad = async(req,res,next) => {
	try{
		let start,end;

		if(req.query.start && req.query.end) {
			start = req.query.start;
			end = new (req.query.end);
			end.setDate(end.getDate()+1);
		} else {
			today = new Date();
			start = new Date(today);
			start.setDate(today.getDate()-30);
			end = new Date(today);
			end.setDate(today.getDate()+1);
			end = end.toISOString().split("T")[0];
		}

		const [sales, SoldProducts] = await Promise.all([
			createSalesReport(start, end),
			getMostSellingProducts(),
		  ]);
	  
		  const allOrders = await getorders(start, end);
	  
		  if (sales === 0 || SoldProducts == 0 ||allOrders.length === 0) {
			res.render("salesReport" ,{
				Mproducts:0,
				sales:0,
				orders:0,
			});
		  }

		  res.render("salesReport", {
			Mproducts: SoldProducts,
			sales,
			orders: allOrders,
		  });

	} catch (error) {
		next(error)
	};
};

// ------------ creating sales report ------------------\\
const createSalesReport = async (startDate, endDate) => {
	try {
	  const orders = await OrderDB.find({
		orderDate: {
		  $gte: startDate,
		  $lte: endDate,
		},
	  });
  
	  if (!orders) {
		return 0;
	  }
  
	  const transformedTotalStockSold = {};
	  const transformedProductProfits = {};
  
	  const getProductDetails = async (productId) => {
		return await ProductDB.findById(productId);
	  };
  
	  for (const order of orders) {
		for (const productInfo of order.products) {
		  const productId = productInfo.productId;
		  const quantity = productInfo.quantity;
  
		  const product = await getProductDetails(productId);
		  const productName = product.productName;
		  const image = product.images;
		  const price = product.price;
  
		  if (!transformedTotalStockSold[productId]) {
			transformedTotalStockSold[productId] = {
			  id: productId,
			  name: productName,
			  quantity: 0,
			  image: image,
			};
		  }
		  transformedTotalStockSold[productId].quantity += quantity;
  
		  if (!transformedProductProfits[productId]) {
			transformedProductProfits[productId] = {
			  id: productId,
			  name: productName,
			  profit: 0,
			  image: image,
			  price: price,
			};
		  }
		  const productPrice = product.price;
		  const productCost = productPrice * 0.7;
		  const productProfit = (productPrice - productCost) * quantity;
		  transformedProductProfits[productId].profit += productProfit;
		}
	  }
  
	  const totalStockSoldArray = Object.values(transformedTotalStockSold);
	  const productProfitsArray = Object.values(transformedProductProfits);
  
	  const totalSales = Math.floor(
		productProfitsArray.reduce((total, product) => total + product.profit, 0)
	  );
  
	  const salesReport = {
		totalSales,
		totalStockSold: totalStockSoldArray,
		productProfits: productProfitsArray,
	  };
  
	  return salesReport;
	} catch (error) {
	  console.error("Error generating the sales report:", error.message);
	}
  };

  //------------ finding most selling product -----------------\\
  const getMostSellingProducts = async() => {
	try {
		const pipeline = [
			{
			  $unwind: "$products",
			},
			{
			  $match: {
				"products.OrderStatus": { $ne: "Cancelled" },
			  },
			},
			{
			  $group: {
				_id: "$products.productId",
				count: { $sum: "$products.quantity" },
			  },
			},
			{
			  $lookup: {
				from: "products",
				localField: "_id",
				foreignField: "_id",
				as: "productData",
			  },
			},
			{
			  $sort: { count: -1 },
			},
			{
			  $limit: 5, // Limit to the top 5 products
			},
		  ];

		  const mostSellingProducts = await OrderDB.aggregate(pipeline);

		  if(!mostSellingProducts) {
			return 0;
		  }
		  return mostSellingProducts;
	} catch (error) {
		console.error("Error fetching most selling Products",error);
		return [];
	}
  };

  // ----------- all orders -----------------\\
  const getorders = async (startDate, endDate) => {
	try {
	  // const orders = await OrderDB.find();
  
	  const orders = await OrderDB.find({
		orderDate: {
		  $gte: startDate,
		  $lte: endDate,
		},
	  });
  
	  const productWiseOrdersArray = [];
  
	  for (const order of orders) {
		for (const productInfo of order.products) {
		  const productId = productInfo.productId;      
  
		  const product = await ProductDB.findById(productId).select(
			"productName  price"
		  );
		  const userDetails = await User.findById(order.userId).select("email");
  
		  if (product) {
			// Push the order details with product details into the array
			productWiseOrdersArray.push({
			  user: userDetails,
			  product: product,
			  orderDetails: {
				_id: order._id,
				userId: order.userId,
				shippingAddress: order.shippingAddress,
				orderDate: order.orderDate,
				totalAmount: productInfo.quantity * product.price,
				OrderStatus: productInfo.OrderStatus,
				StatusLevel: productInfo.StatusLevel,
				paymentStatus: productInfo.paymentStatus,
				paymentMethod: order.paymentMethod,
				quantity: productInfo.quantity,
				trackId: order.trackId,
			  },
			});
		  }
		}
	  }
  
	  return productWiseOrdersArray;
	} catch (error) {
	  console.log(error.message);
	}
  };

  

module.exports = {
	salesReportPageLoad,	
}
