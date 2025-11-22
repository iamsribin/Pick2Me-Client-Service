

  export const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };


 export   const formatTimestamp = (dateString: string) => {
      if (!dateString) return "Unknown time";
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return "Invalid date";
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMins = Math.floor(diffInMs / 60000);
      const diffInHours = Math.floor(diffInMs / 3600000);
      const diffInDays = Math.floor(diffInMs / 86400000);
  
      if (diffInMins < 1) return "Just now";
      if (diffInMins < 60) return `${diffInMins} min ago`;
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
      return date.toLocaleDateString();
    };


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