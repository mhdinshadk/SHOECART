//========== for registration ===============//
function validRegister() {
    const firstName = document.getElementById('firstname').value.trim();
    const lastName = document.getElementById('lastname').value.trim();
    const email = document.getElementById('email').value.trim();
    const mobile = document.getElementById('phonenumber').value.trim();
    const password = document.getElementById('password').value;
    const cpassword = document.getElementById('confirm_password').value;
  
    // Clear any previous error messages
    document.getElementById('name-error').textContent = '';
    document.getElementById('Lname-error').textContent = '';
    document.getElementById('email-error').textContent = '';
    document.getElementById('mobile-error').textContent = '';
    document.getElementById('password-error').textContent = '';
    document.getElementById('password-mismatch').textContent = '';
  
    if (!firstName) {
      document.getElementById('Fname-error').textContent = 'First name field should not be empty!';
      return false;
    }
  
    if (!lastName) {
      document.getElementById('Lname-error').textContent = 'Last name field should not be empty!';
      return false;
    }
  
    if (!email) {
      document.getElementById('email-error').textContent = 'Email field should not be empty!';
      return false;
    }
  
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
  
    if (!emailRegex.test(email)) {
      document.getElementById('email-error').textContent = 'Please enter a valid email address. (eg: example@gmail.com)';
      return false;
    }
  
    const mobileRegex = /^[6-9]\d{9}$/;
  
    if (!mobileRegex.test(mobile)) {
      document.getElementById('mobile-error').textContent = 'Mobile number should be a 10-digit valid number';
      return false;
    }
  
    if (new Set(mobile).size === 1) {
      document.getElementById('mobile-error').textContent = 'Mobile number should not consist of the same digit.';
      return false;
    }
  
    const passwordRegex = /^(?=.*[!@#$%^&*]).{6,}$/;
  
    if (!passwordRegex.test(password)) {
      document.getElementById('password-error').textContent = 'Password must be at least 6 characters and contain a special character.';
      return false;
    }
  
    if (password !== cpassword) {
      document.getElementById('password-mismatch').textContent = 'Passwords do not match. Please try again.';
      return false;
    }
  
    return true;
  }
  
  // function validForgotPassword() {
  //   const password = document.getElementById('password').value;
  //   const cpassword = document.getElementById('confirm_password').value;
  
  //   // Clear any previous error messages
  //   document.getElementById('password-error').textContent = '';
  //   document.getElementById('password-mismatch').textContent = '';
  
  //   const passwordRegex = /^(?=.*[!@#$%^&*]).{6,}$/;
  
  //   if (!passwordRegex.test(password)) {
  //     document.getElementById('password-error').textContent = 'Password must be at least 6 characters and contain a special character.';
  //     return false;
  //   }
  
  //   if (password !== cpassword) {
  //     document.getElementById('password-mismatch').textContent = 'Passwords do not match. Please try again.';
  //     return false;
  //   }
  
  //   return true;
  // }
  


// // ========== for forgot password ===============
// function validForgotPassword() {
//     const password = document.getElementById('password').value;
//     const cpassword = document.getElementById('Cpassword').value;
  
//     // Clear any previous error messages
//     document.getElementById('password-error').textContent = '';
//     document.getElementById('password-mismatch').textContent = '';
  
//     const passwordRegex = /^(?=.*[!@#$%^&*]).{6,}$/;
  
//     if (!password || !passwordRegex.test(password)) {
//         document.getElementById('password-error').textContent = 'Password must be at least 6 characters and contain a special character.';
//         return false;
//     }
  
//     if (password !== cpassword) {
//         document.getElementById('password-mismatch').textContent = 'Passwords do not match. Please try again.';
//         return false;
//     }
  
//     return true;
// }
