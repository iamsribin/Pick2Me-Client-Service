enum UserApiEndpoints {
  // ride
  CANCEL_RIDE ="/users/me/cancel-ride",
  COMPLETE_RIDE = "/users/me/ride-completed",
  UPLOAD_CHAT_FILE = "/users/me/upload-chat-file",
  BOOK_MY_CAB="/bookings/me/book-cab",
  GET_NEARBY_DRIVERS="/bookings/users/list-online-drivers",
  // auth 
  REGISTER = '/users/register',
  CHECK_USER ='/users/check-registration',
  CHECK_GOOGLE_LOGIN ="/users/check-login-email",
  CHECK_LOGIN_NUMBER = "/users/check-login-number",
  RESENT_OTP = "/users/resend-otp",
  // User 
  PROFILE = '/users/me',             
  UPDATE_AVATAR = '/users/me/avatar', 
  NAME = '/users/me/name',     
  HOME = '/users/home',
  }

export default UserApiEndpoints;