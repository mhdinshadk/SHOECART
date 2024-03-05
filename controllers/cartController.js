const mongoose = require("mongoose");
const Cart = require("../models/cart");
const Product = require("../models/product");
const User = require("../models/users");
const  Category = require("../models/category");
const { ObjectId } = require('mongoose').Types;


const addToCart = async (req, res) => {
    try {
        if (req.session.user_id) {
            const productId = req.body.id;
            const name = req.session.user_id;
            const userData = await User.findOne({ _id: name });
            const userId = userData._id;
            const productData = await Product.findById(productId);

            if (!productData) {
                return res.status(404).json({ error: "Product not found" });
            }

            const userCart = await Cart.findOne({ user: userId });

            let productPrice = 0;

            if (productData.discountedPrice || productData.categoryDiscountedPrice) {
                productPrice = productData.discountedPrice || productData.categoryDiscountedPrice;
            } else {
                productPrice = productData.price;
            }

            if (userCart) {
                const productExistIndex = userCart.products.findIndex(
                    (product) => product.productId == productId
                );

                if (productExistIndex !== -1) {
                    const cartData = await Cart.findOne(
                        { user: userId, "products.productId": productId },
                        { "products.productId.$": 1, "products.quantity": 1 }
                    );

                    const [{ quantity }] = cartData.products;

                    if (productData.quantity <= quantity) {
                        return res.json({ outOfStock: true });
                    } else {
                        await Cart.findOneAndUpdate(
                            { user: userId, "products.productId": productId },
                            { $inc: { "products.$.quantity": 1 } }
                        );

                        return res.json({ success: true, message: 'Item quantity increased in the cart.' });
                    }
                } else {
                    await Cart.findOneAndUpdate(
                        { user: userId },
                        {
                            $push: {
                                products: { productId: productId, price: productPrice },
                            },
                        }
                    );

                    // Send the response after adding the product to the cart
                    const updatedCart = await Cart.findOne({ user: userId });
                    const count = updatedCart ? updatedCart.products.length : 0;

                    return res.json({ success: true, message: 'Item added to the cart.', count: count });
                }
            } else {
                const data = new Cart({
                    user: userId,
                    products: [{ productId: productId, price: productPrice }],
                });
                await data.save();

                // Send the response after adding the product to the cart
                const updatedCart = await Cart.findOne({ user: userId });
                const count = updatedCart ? updatedCart.products.length : 0;

                return res.json({ success: true, message: 'Item added to the cart.', count: count });
            }
        } else {
            return res.json({ loginRequired: true });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: "An error occurred" });
    }
};


  
  
  const loadCart = async (req, res) => {
	try {
	
	  const categoryData = await Category.find();
	  
	  const id = req.session.user_id;
	  const userData = await User.findById({ _id: id });
	 
  
	  const userId = userData._id;

	 
  
	  const cartData = await Cart
		.findOne({ user: userId })
		.populate("products.productId")
		.exec()

		console.log(cartData,"________________________________");
	

	  if (req.session.user_id) {
		if (cartData) {
		  let Total;
		  if (cartData.products != 0) {
			console.log("get if");
			const total = await Cart.aggregate([
			  {
				$match: { user: new ObjectId(userId) },
			  },
			  {
				$unwind: "$products",
			  },
			  {
				$project: {
				  price: "$products.price",
				  quantity: "$products.quantity",
				},
			  },
			  {
				$group: {
				  _id: null,
				  total: {
					$sum: {
					  $multiply: ["$quantity", "$price"],
					},
				  },
				},
			  },
			]);
			Total = total[0].total;
  
			console.log(Total,"======================");
			console.log(userId);
  
			res.render("cart", {
			  user: userData,
			  cart: cartData.products,
			  userId: userId,
			  total: Total,
			  category: categoryData,
			});
			console.log("case1");
		  } else {
			res.render("cart", {
			  user: req.session.user_id,
			  cart: [],
			  total: 0,
			  
			  category: categoryData,
			});
			console.log("case2");
		  }
		} else {
		  res.render("cart", {
			user: userData,
			cart: [],
			total: 0,
			
			category: categoryData,
		  });
		  console.log("case3");
		}
	  } else {
		res.render("cart", {
		  message: "User Logged",
		  user: userData,
		  cart: [],
		  total: 0,
		  
		  category: categoryData,
		});
		console.log("case4");
	  }
	} catch (error) {
	  console.log(error.message);
	  throw new Error(error);
	}
  };
  
  const cartQuantity = async (req, res) => {
	try {
	  const userId = req.session.user_id;
	  const productId = req.body.product;
	  const count = parseInt(req.body.count);
  
	  const cartData = await Cart.findOne(
		{
		  user: new ObjectId(userId),
		  "products.productId": new ObjectId(productId),
		},
		{
		  "products.productId.$": 1,
		  "products.quantity": 1,
		}
	  );
  
	  const [{ quantity }] = cartData.products;
  
	  const stockAvailable = await Product.findById({
		_id: new ObjectId(productId),
	  });
  
	  if (stockAvailable.quantity < quantity + count) {
		return res.json({ changeSuccess: false, message: "Insufficient stock" });
	  }
  
	  let productPrice = stockAvailable.price
  
	//   if (
	// 	stockAvailable.discountedPrice ||
	// 	stockAvailable.categoryDiscountedPrice
	//   ) {
	// 	productPrice =
	// 	  stockAvailable.discountedPrice > stockAvailable.categoryDiscountedPrice
	// 		? stockAvailable.discountedPrice
	// 		: stockAvailable.categoryDiscountedPrice;
	//   } else {
	// 	productPrice = stockAvailable.price;
	//   }
  
  
  
	  await Cart.updateOne(
		{
		  user: userId,
		  "products.productId": productId,
		},
		{
		  $inc: { "products.$.quantity": count },
		  $set: {
			"products.$.totalPrice": productPrice * (quantity + count),
		  },
		}
	  );
  
	  res.json({ changeSuccess: true });
	} catch (error) {console.log(error.message);
	  throw new Error(error);
	
	  res.json({ changeSuccess: false, message: "An error occurred" });
	}
  };
  
  const removeProduct = async (req, res) => {
	try {
	  const productId = req.body.product;
  
	  const user = req.session.user_id;
	  const userId = user._id;
  
	  const cartData = await Cart.findOneAndUpdate(
		{ "products.productId": productId },
		{
		  $pull: { products: { productId: productId } },
		}
	  );
	  res.json({ success: true });
	} catch (error) {
	  console.log(error.message);
	  throw new Error(error);
	}
  };
  
  module.exports = {
	addToCart,
	loadCart,
	cartQuantity,
	removeProduct,
  };