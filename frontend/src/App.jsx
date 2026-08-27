import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThemeProvider, useTheme } from '@/context/ThemeContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { enableJsAnimations } from '@/lib/anim.js';

import Navbar from '@/components/layout/Navbar.jsx';
import Footer from '@/components/layout/Footer.jsx';
import ScrollToTop from '@/components/ui/ScrollToTop.jsx';
import PageTransition from '@/components/ui/PageTransition.jsx';
import BackToTop from '@/components/ui/BackToTop.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';

import HomePage from '@/features/home/HomePage.jsx';
import MatchesPage from '@/features/matches/MatchesPage.jsx';
import MatchPage from '@/features/match/MatchPage.jsx';
import NewsPage from '@/features/news/NewsPage.jsx';
import AuthPage from '@/features/auth/AuthPage.jsx';
import ProfilePage from '@/features/auth/ProfilePage.jsx';
import AboutPage from '@/features/about/AboutPage.jsx';
import NotFoundPage from '@/pages/NotFoundPage.jsx';

function Toasts() {
  const { theme } = useTheme();
  return <ToastContainer theme={theme} position="bottom-right" autoClose={3500} newestOnTop closeOnClick pauseOnHover />;
}

function Shell() {
  useEffect(() => {
    enableJsAnimations();
  }, []);
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main id="main">
        <PageTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/match/:id" element={<MatchPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/details" element={<Navigate to="/news" replace />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
      <BackToTop />
      <Toasts />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
