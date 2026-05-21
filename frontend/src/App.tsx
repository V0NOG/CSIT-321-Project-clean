// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./routes/ProtectedRoute";

import FileManager from "./pages/FileManager";
import Analytics from "./pages/Analytics";
import FolderFiles from "./pages/FolderFiles";
import TotpSetup from "./pages/Security/TotpSetup";
import SharedWithMe from "./pages/SharedWithMe";
import StorageConnectors from "./pages/StorageConnectors";
import Explorer from "./pages/Explorer";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes inside AppLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FileManager />} />
          <Route path="/security/mfa" element={<TotpSetup />} />
          <Route path="/profile" element={<UserProfiles />} />
          <Route path="/file-manager" element={<FileManager />} />
          <Route path="/file-manager/folder/:bucket" element={<FolderFiles />} />
          <Route path="/file-manager/folder/custom/:folderId" element={<FolderFiles />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/shared" element={<SharedWithMe />} />
          <Route path="/connectors" element={<StorageConnectors />} />
          <Route path="/explorer" element={<Explorer />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
