    import { configureStore } from "@reduxjs/toolkit";
    import {
    persistStore,persistReducer,FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER
    } from 'redux-persist'
    
    import storage from "redux-persist/lib/storage";
    import notificationSlice from "./slices/notificationSlice";
    import rideSlice from "./slices/rideSlice";
    import UserSlice from "./slices/userSlice";
    import rideRequestSlice from "./slices/rideRequestSlice";
    import issueSlice from "./slices/issuesSlice";
    import { socketMiddleware } from "@/shared/middlewares/socketMiddleware";

    const RideDataPersistConfig={key:"RideData",storage,version:1}
    const UserPersistConfig={key:"UserSlice",storage,version:1}
    const NotificationPersistConfig={key:"NotificationSlice",storage,version:1}

    const RideDataPersistReducer=persistReducer(RideDataPersistConfig,rideSlice.reducer)   
    const UserPersistReducer = persistReducer(UserPersistConfig, UserSlice.reducer);
    const NotificationReducer = persistReducer(NotificationPersistConfig, notificationSlice.reducer);
    const IssueReducer = persistReducer(NotificationPersistConfig, issueSlice.reducer);

    export const store=configureStore({
        reducer:{
            notification: NotificationReducer,
            RideData:RideDataPersistReducer,
            user: UserPersistReducer,
            rideRequest:rideRequestSlice,
            issue:IssueReducer
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
