const admin = require("../models/admin");
const User = require("../models/users");
const bcrypt = require("bcrypt");
const product = require("../models/product");
const category = require("../models/category");
const productDb = require("../models/product");
const path = require("path");
const fs = require("fs");
const {ObjectId} = require('mongodb');


// ------------password security------\\

const securePassword = async(password) =>{
	try{
		const passwordHash = await bcrypt.hash(password ,10);
		return passwordHash;
	}catch (error) {
		console.log(error.message);
	}
};

//----------- admin login page -----------\\

const loadLogin = async (req,res,next) => {
	try{
		res.render('adminlogin');
	}catch (error) {
		next(error);
	}
};

//------------ loading dashboard --------------------- \\


const verifyLogin = async (req, res, next) => {
	try {
	  const email = req.body.email;
	  const password = req.body.password;
  
	  const adminData = await admin.findOne({ email: email });
  
	  if (adminData) {
		console.log(req.body);
		const passwordMatch = await bcrypt.compare(password, adminData.password);
  
		if (passwordMatch) {
			console.log("helloo ooi",req.body)
		  req.session.admin_id = adminData._id;
		  res.redirect("/admin/dashboard");
		} else {
		  res.render("adminlogin", { message: "Email or password is incorrect" });
		}
	  } else {
		res.render("adminlogin", { message: "Email or password is incorrect" });
	  }
	} catch (error) {
	  next(error);
	}
  };
  

//---------------admin dashboard rendering -----------------\\
const 	loadadHome = async (req,res,next) => {
try{
	const users = await User.find({ isListed: false })
	res.render('dashboard',users)
}catch (error) {
	next(error)
}
}

// ------ loading user details --------- \\
const userLoad = async (req,res,next) =>{
	try{
		const user = await User.find();
		console.log('user',user);
		res.render('users',{users:user});
	} catch (error) {
		next(error);
	}
};

//------- blockUser or unblockUser ---------------\\
const blockUser = async (req,res,next) => {
	try{
		const id = req.query.id;
		const user = await User.findById(id);

		if(user) {
			user.isBlock = !user.isBlock;
			await user.save();

			if(req.session.user_id === id) {
				req.session.user_id = null;
			}
		}

		const Users = await User.find();
		res.redirect('/admin/users');
	} catch (error) {
		next(error);
	}
};
// ------------ loading add product page -------------------\\
const loadaddProducts = async (req, res, next) => {
	try {
	  const categories = await category.find();
  
	  res.render("addProducts", { category: categories });
	} catch (error) {
	  next(error);
	}
  };

  // ---------------- add product ------------------\\
const addProduct = async (req, res, next) => {
	try {
	  const productname = req.body.productname;
	  const brand = req.body.brand;
	  const category = req.body.category;
	  const description = req.body.description;
	  const price = req.body.price;
	  const quantity = req.body.quantity;
	  const images = [];
	  for (let i = 0; i < req.files.length; i++) {
		images[i] = req.files[i].filename;
	  }
  
	  const newProduct = new product({
		productName: productname,
		brand: brand,
		category: category,
		description: description,
		price: price,
		images: images,
		quantity: quantity,
	  });
	  const productData = await newProduct.save();
	  if (productData) {
		res.redirect("/admin/viewProduct");
	  } else {
		res.render("addProducts", { message: "Something went wrong" });
	  }
	} catch (error) {
	  next(error);
	}
  };
  //------------ loadade viewProductPage ------------------------\\
  const loadViewProducts = async (req, res, next) => {
	try {
	  const products = await product
		.find()
		.populate("category")
		console.log(products);
	  const categories = await category.find();
	  res.render("viewProducts", {
		products: products,
		categories: categories,
	  });
	} catch (error) {
	  next(error);
	}
  };
  const loadEditProduct = async (req, res, next) => {
	try {
	  const id = req.query.id;
  
	  const dataproduct = await product.findById(id);
  
	  const categories = await category.find();
  
	  if (dataproduct) {
		res.render("editProduct", { data: dataproduct, category: categories });
	  } else {
		res.redirect("/admin/viewProduct");
	  }
	} catch (error) {
	  next(error);
	}
  };
    // -------------- list and unlist product ----------\\
const unlistProduct = async (req, res, next) => {
	try {
	  const id = req.query.id;
	  const product1 = await product.findById(id);
  
	  if (product1) {
		product1.status = !product1.status;
		await product1.save();
	  }
  
	  const products = await product.find().populate("category");
	  const categories = await category.find();
  
	  res.redirect("/admin/viewProduct");
	} catch (error) {
	  next(error);
	}
  };
  // ----------- updating edit product ------------\\
const editProduct = async (req, res, next) => {
	try {
	  const id = req.body.id;
	  const productname = req.body.productname;
	  const brand = req.body.brand;
	  const category = req.body.category;
	  const price = req.body.price;
	  const quantity = req.body.quantity;
	  const description = req.body.description;

  
	  // Check if there are new images
	  const newImages = [];
	  if (req.files && req.files.length > 0) {
		for (let i = 0; i < req.files.length; i++) {
		  newImages.push(req.files[i].filename);
		}
	  }
  
	  const existingProduct = await product.findById(id);
  
	  if (existingProduct) {
		existingProduct.productName = productname;
		existingProduct.brand = brand;
		existingProduct.category = category;
		existingProduct.price = price;
		existingProduct.quantity = quantity;
		existingProduct.description = description;
  
		// Add new images, if any
		if (newImages.length > 0) {
		  existingProduct.images = existingProduct.images.concat(newImages);
		}
  
		// Handle image deletion
		if (req.body.deleteImages) {
		  for (const imageToDelete of req.body.deleteImages) {
			existingProduct.images = existingProduct.images.filter(
			  (image) => image !== imageToDelete
			);
  
			// Optionally, you can delete the image file from your storage here
			const imagePath = path.join(
			  __dirname,
			  "../static/adminAssets/images/products",
			  imageToDelete
			);
			fs.unlink(imagePath, (err) => {
			  if (err) {
				console.error("Error deleting file:", err);
			  }
			});
		  }
		}
  
		const updatedProduct = await existingProduct.save();
  
		if (updatedProduct) {
		  res.redirect("/admin/viewProduct");
		} else {
		  res.render("editProduct", {
			data: existingProduct,
			message: "Failed to update the product",
		  });
		}
	  } else {
		res.redirect("/admin/viewProduct");
	  }
	} catch (error) {
	  next(error);
	}
  };
   

  //-------------------- load catogery page ----------------------\\
  const loadAddCategories =  async (req,res,next) => {
	try{
    res.render("addCategories");
	} catch (error) {
		next(error);
	}
  };

  //-------------- insert into catogery in database ----------------\\
  const insertCategory = async (req,res) => {
	try{
		const categoryname = req.body.category_name;
		const already = await category.findOne({
		name: { $regex: categoryname, $options: "i" },
		});

		if(already) {
			res.render("addCategories", {message :"Catogory Already Created"})
		} else {
			const data = await new category({
			  name: req.body.category_name,
			  description: req.body.category_description,
			  isListed: true,
			});
		    const result = await data.save();
		    res.redirect("/admin/addCategories");
	    }
    } catch (error) {
		console.log(error);
	  }
  };
  //------------ rendering view catogory -------------------\\
  const loadViewCategory = async (req, res, next) => {
	try {
	  const categories = await category.find();
	  res.render("viewCategories", {
		category: categories
	  });
	} catch (error) {
	  next(error);
	}
  };

  // -------------- loading EditCatogory Page ------------------------\\
const loadEditCatogories = async (req, res, next) => {
	try {
	  const id = req.query.id;
  
	  const dataCategory = await category.findById(id);
  
	  if (dataCategory) {
		res.render("editCategory", { data: dataCategory }); // Pass the category object to the template
	  } else {
		res.redirect("/admin/viewCategories");
	  }
	} catch (error) {
	  next(error);
	}
  };
  //----------- Edit Catogory ---------------------------\\
  const editCategory = async (req, res, next) => {
	try {
	  const categoryName = req.body.categoryname;
	  const oldCategoryName = req.body.oldCategoryName;
  
	  const dataCategory = await category.findById(req.body.id);
	  console.log(dataCategory);
  
	  if (categoryName != oldCategoryName) {
		console.log("machuu");
		const already = await category.findOne({
		  name: { $regex: new RegExp(`^${categoryName}$`, "i") },
		});
		if (already) {
		  res.render("editCategory", {
			data: dataCategory,
			message: "Category Already Created",
		  });
		} else {
		  const editData = await category.findByIdAndUpdate(
			{ _id: req.body.id },
			{
			  $set: {
				name: req.body.categoryname,
				description: req.body.categorydes,
			  },
			}
		  );
            console.log(editData);
		  res.redirect("/admin/viewCategories");
		}
	  }
  
	  res.redirect("/admin/viewCategories");
	} catch (error) {
	  next(error);
	}
  };



  //-------------- list and unlist Category ----------\\
const unlistCategory = async (req, res, next) => {
	try {
	  const id = req.query.id;
	  const Category = await category.findById(id);
  
	  if (Category) {
		Category.isListed = !Category.isListed;
		await Category.save();
	  }
  
	  const categories = await category.find();
  
	  res.redirect("/admin/viewCategories");
	} catch (error) {
	  next(error);
	}
  };


  // -------- admin logout ----------------------\\

const adminLogout = async (req,res,next) =>{
	try {
		req.session.destroy();
		res.redirect("/admin")
	}catch (error) {
		next(error);
	}
}
  
  

module.exports = {
	loadLogin,
	verifyLogin,
	loadadHome,
	adminLogout,
	userLoad,
	blockUser,
	loadaddProducts,
	addProduct,
	loadViewProducts,
	loadAddCategories,
	insertCategory,
	loadViewCategory,
	unlistProduct,
	unlistCategory,
	loadEditProduct,
    editProduct,
	loadEditCatogories,
	editCategory


}