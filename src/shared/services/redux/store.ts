    import { configureStore } from "@reduxjs/toolkit";
    import {
    persistStore,persistReducer,FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER
    } from 'redux-persist'
    
    // import DriverRideSlice from "./slices/driverRideSlice";
    import storage from "redux-persist/lib/storage";
    import notificationSlice from "./slices/notificationSlice";
    import rideSlice from "./slices/rideSlice";
    import LoadingSlice from "./slices/loadingSlice";
    import UserSlice from "./slices/userSlice";
import { socketMiddleware } from "@/shared/middlewares/socketMiddleware";

    // const driverRideMapRideMapPersistConfig={key:"DriverRideMap",storage,version:1}
    // // const LoadingPersistConfig={key:"Loading",storage,version:1}
    const RideDataPersistConfig={key:"RideData",storage,version:1}
    const UserPersistConfig={key:"UserSlice",storage,version:1}
    const NotificationPersistConfig={key:"NotificationSlice",storage,version:1}

    // const DriverRideMapPersistReducer=persistReducer(driverRideMapRideMapPersistConfig,DriverRideSlice.reducer)
    // const LoadingPersistConfigReducer = persistReducer(LoadingPersistConfig, LoadingSlice.reducer)
    const RideDataPersistReducer=persistReducer(RideDataPersistConfig,rideSlice.reducer)   
    const UserPersistReducer = persistReducer(UserPersistConfig, UserSlice.reducer);
    const NotificationReducer = persistReducer(NotificationPersistConfig, notificationSlice.reducer);

    export const store=configureStore({
        reducer:{
            notification: NotificationReducer,
            RideData:RideDataPersistReducer,
            // driverRideMap: DriverRideMapPersistReducer,
            loading: LoadingSlice.reducer,
            user: UserPersistReducer,
        },
        middleware: (getDefaultMiddleware) => {
            const middleware = getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
                },
            }).concat(socketMiddleware);
            return middleware;
        },

    })
    export type RootState = ReturnType<typeof store.getState>;
    export type AppDispatch = typeof store.dispatch;
    export const persistor=persistStore(store)
