enum DriverApiEndpoints {
  // auth
  CHECK_LOGIN_NUMBER = "/drivers/check-login-number",
  GOOGLE_LOGIN = "/drivers/check-login-email",
  LOGIN = "/drivers/login",
  SIGNUP = "/drivers/signup",
  CHECK_REGISTER = "/drivers/check-registration",
  REGISTER = "/drivers/register",
  REGISTER_LOCATION = "/drivers/location/register",
  // doc
  RESUBMISSION = "/drivers/documents/resubmission/:id",
  REGISTER_VEHICLE = "/drivers/vehicle/register",
  REGISTER_IDENTIFICATION = "/drivers/identification/register",
  REGISTER_INSURANCE = "/drivers/insurance/register",
  REGISTER_PROFILE_IMAGE = "/drivers/profile-image/register",
  MY_DOCUMENTS = "/drivers/me/documents",
  // driver 
  PROFILE = "/drivers/me",
  ACTIVITY = "/drivers/me/stats",
  PROFILE_IMAGE = `/drivers/me/profile-image`,
  UPLOAD_CHAT_FILE = "/drivers/me/upload-chat-file",
  COMPLETE_RIDE = "/bookings/complete-ride/:rideId",
  // ride 
  CASH_IN_HAND_PAYMENT = "/payments/cash-in-hand/payment",
  ONLINE_STATUS = "/drivers/me/online-status",
  MY_TRIPS = `/drivers/me/trips`,
  CHECK_SECURITY_PIN = "/bookings/check-security-pin",
  MAIN_DASHBOARD = "/drivers/me/main-dashboard",
  TRIP_DETAILS = "/drivers/me/trip-details",
  WALLET= "/payments/drivers/me/wallet",
  REFRESH_ONBOARDING= "/payments/drivers/me/wallet/refresh-onboarding",
}

export default DriverApiEndpoints;
