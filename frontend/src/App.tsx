// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/FileManager";
import ProtectedRoute from "./routes/ProtectedRoute";
import AlternativeLayout from "./layout/AlternativeLayout";

import FileManager from "./pages/FileManager";
import Analytics from "./pages/Analytics";

import TextGeneratorPage from "./pages/Ai/TextGenerator";
import ImageGeneratorPage from "./pages/Ai/ImageGenerator";
import CodeGeneratorPage from "./pages/Ai/CodeGenerator";
import VideoGeneratorPage from "./pages/Ai/VideoGenerator";
import FolderFiles from "./pages/FolderFiles";
import TotpSetup from "./pages/Security/TotpSetup";
import SharedWithMe from "./pages/SharedWithMe";
import StorageConnectors from "./pages/StorageConnectors";

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
          {/* use either index or path, not both */}
          <Route index element={<Home />} />
          <Route path="/security/mfa" element={<TotpSetup />} />
          <Route path="/profile" element={<UserProfiles />} />
          <Route path="/blank" element={<Blank />} />
          <Route path="/file-manager" element={<FileManager />} />
          <Route path="/file-manager/folder/:bucket" element={<FolderFiles />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/shared" element={<SharedWithMe />} />
          <Route path="/connectors" element={<StorageConnectors />} />
          <Route path="/file-manager/folder/custom/:folderId" element={<FolderFiles />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />

        {/* Alternative Layout - for special pages */}
        <Route element={<AlternativeLayout />}>
          {/* AI Generator */}
          <Route path="/text-generator" element={<TextGeneratorPage />} />
          <Route path="/image-generator" element={<ImageGeneratorPage />} />
          <Route path="/code-generator" element={<CodeGeneratorPage />} />
          <Route path="/video-generator" element={<VideoGeneratorPage />} />
        </Route>
      </Routes>
    </Router>
  );
}