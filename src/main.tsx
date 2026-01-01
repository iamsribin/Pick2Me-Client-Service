import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import { ThemeProvider } from "@material-tailwind/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter as Router } from "react-router-dom";
import { persistor, store } from "./shared/services/redux/store";
import { PersistGate } from "redux-persist/integration/react";
import ErrorBoundary from "@/shared/components/ErrorBoundaries";
import "./index.css";
import { Toaster } from "@/shared/components/ui/toaster"

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <Provider store={store}>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <PersistGate persistor={persistor}>
              <Router> 
                 <Toaster />
                  <App />
              </Router>
            </PersistGate>
          </GoogleOAuthProvider>
        </Provider>
      </ThemeProvider>
    </ErrorBoundary>
  // </React.StrictMode>
);