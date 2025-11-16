

//   export const formatDate = (date: Date | string): string => {
//     return new Date(date).toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });
//   };


// // export const formatCurrency = (amount: number) =>{
// // return new Intl.NumberFormat("en-US", {
// //   style: "currency",
// //   currency: "USD",
// // }).format(amount);
// // }

// export  const formatCurrency = (amount: number | any) => {
//     if ( typeof amount !== "number") return "₹0.00";
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2,
//     }).format(amount);
//   };