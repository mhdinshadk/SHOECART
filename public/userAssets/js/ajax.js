// ========== removing cart items ========
// function removeCartItem(user, product, qty) {
// 	Swal.fire({
// 	  title: 'Are you sure?',
// 	  text: 'This action will remove the item from your cart.',
// 	  icon: 'warning',
// 	  showCancelButton: true,
// 	  confirmButtonColor: '#d33',
// 	  cancelButtonColor: '#3085d6',
// 	  confirmButtonText: 'Yes, remove it!',
// 	  cancelButtonText: 'No, cancel!',
// 	}).then((result) => {
// 	  if (result.isConfirmed) {
// 		console.log('Button clicked');
// 		// console.log(user, product, qty);
// 		$.ajax({
// 		  url: '/removeCart',
// 		  method: 'delete',
// 		  data: { user, product, qty }, // Removed the "encoded: true" part
// 		  success: (response) => {
// 			console.log(response);
// 			if (response.remove == 1) {
// 			  $('#remove-' + product).remove();
// 			  const tableLength = $('.table_row').length;
// 			  if(  tableLength === 0)
// 			  location.reload();
// 			}
// 		  },
// 		});
// 	  }
// 	});
//   }
  