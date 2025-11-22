import "./App.scss";
import React from "react";
import { Routes, Route } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { Toaster } from "@/shared/components/ui/toaster";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import NotFound from "@/shared/components/NotFound";
import ErrorBoundary from "./shared/components/ErrorBoundaries";
import { LoaderPinwheelIcon } from "lucide-react";

const UserRoutes = React.lazy(
  () => import("@/features/user/routes/user-routes")
);
const DriverRoutes = React.lazy(
  () => import("@/features/driver/routes/driver-routes")
);
const AdminRoutes = React.lazy(
  () => import("@/features/admin/routes/admin-routes")
);

function App() {
  return (
    <ChakraProvider>
      <TooltipProvider>
        <Toaster />
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center h-screen w-full">
              <LoaderPinwheelIcon
                className="animate-spin text-yellow-400"
                size={48}
              />
            </div>
          }
        >
          <ErrorBoundary>
            <Routes>
              <Route path="/*" element={<UserRoutes />} />
              <Route path="/driver/*" element={<DriverRoutes />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </React.Suspense>
      </TooltipProvider>
    </ChakraProvider>
  );
}

export default App;
