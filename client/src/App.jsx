import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import SplashPage from './pages/SplashPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ScanPage from './pages/ScanPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import DataPage from './pages/DataPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ReminderManager from './components/ReminderManager.jsx';


const router = createBrowserRouter(
  [
    { path: '/', element: <SplashPage /> },
    { path: '/onboarding', element: <OnboardingPage /> },
    { path: '/auth', element: <AuthPage /> },
    { path: '/home', element: <HomePage /> },
    { path: '/scan', element: <ScanPage /> },
    { path: '/result', element: <ResultPage /> },
    { path: '/data', element: <DataPage /> },
    { path: '/profile', element: <ProfilePage /> }
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

export default function App() {
  return (
    <>
      <ReminderManager />
      <RouterProvider router={router} />
    </>
  );
}
