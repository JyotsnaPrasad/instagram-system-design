import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ApiError } from './api/client';
import { AppLayout } from './components/AppLayout';
import { ActingUserProvider } from './context/ActingUserContext';
import { FeedPage } from './pages/FeedPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { ProfilePage } from './pages/ProfilePage';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Retry once for network/server errors only; a 4xx answer won't change on retry.
        retry: (failureCount, error) =>
          failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
        staleTime: 5_000,
      },
    },
  });
}

// Opt in to React Router v7 behaviour now; silences the v6 deprecation warnings.
export const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function AppRoutes() {
  return (
    <ActingUserProvider>
      <ScrollToTop />
      <AppLayout>
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/users/:username" element={<ProfilePage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </ActingUserProvider>
  );
}

export function App({ queryClient }: { queryClient?: QueryClient }) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter future={routerFuture}>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
