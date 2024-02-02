const isLogin= async (req,res,next)=>{
	try {
	  if(req.session.user_id){
		next()
	  }
	  else{
		res.redirect('/login')
	  }
	  
	   
	} catch (error) {
	  console.log(error);
		  res.status(500).send('Server Error');
	  
	}
  }
  
  const isLogout = async (req,res,next)=>{
	try {
	  if(req.session.user_id){
		res.redirect('/')
	  }else{
		next()
	  }
	 
	} catch (error) {
	 
	  console.log(error);
	  res.status(500).send('Server Error');
	}
  }
  const checkBlock= async (req, res, next) => {
	try {
	  const userData = await User.findById(req.session.user_id);
	  if (userData.is_block === 0) {
		res.render("login", { message: "Blocked By Admin" });
		 // Move next() inside the if block
	  } else {
		next();
	  }
	} catch (error) {
	  console.log(error.message);
	}
  };
  
  
  module.exports = {
	isLogin,
	isLogout ,
	checkBlock
  }