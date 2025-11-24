export enum CommonApiEndPoint{
VEHICLE_MODELS = "/bookings/vehicle/models",

NOTIFICATIONS = "/notifications/me/notifications",
CLEAR_NOTIFICATION= "/notifications/me/:id",
CLEAR_ALL_NOTIFICATION="/notifications/me/clear-all",
MARK_AS_READ="/notifications/me/:id/read",
MARK_ALL_AS_READ ="/notifications/me/mark-all-read",
UNREAD_COUNT="/notifications/me/unread-count"
}