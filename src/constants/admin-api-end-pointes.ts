export enum AdminApiEndpoints {
  BASE = "/admin",
  ADD_SUBSCRIPTION = '/notifications/admin/push/subscribe',
  FETCH_ISSUES_COUNT ='/notifications/admin/issues/unread-count',
  ISSUES ='/notifications/admin/issues',
  // Drivers
  DRIVERS = "/admin/drivers",                        
  DRIVER = "/admin/drivers/:id",   
              
  DRIVER_STATUS = "/admin/drivers/:driverId/status",
  DRIVER_VERIFICATIONS = "/admin/drivers/:driverId/verifications",

  // Users
  USERS = "/admin/users",                            
  USER = "/admin/users/:id",                     
  DASHBOARD = "/admin/dashboard",                    
}
