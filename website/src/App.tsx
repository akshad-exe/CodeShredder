import { Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { HomePage } from "./pages/HomePage";
import { DownloadPage } from "./pages/DownloadPage";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/download" element={<DownloadPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
