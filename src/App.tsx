import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AuthExpiredListener } from '@/Contexts/AuthContext';
import { CartProvider } from '@/Contexts/CartContext';
import { AddressesProvider } from '@/Contexts/AddressesContext';
import { CategoriesProvider } from '@/Contexts/CategoriesContext';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { HomePage } from '@/pages/HomePage';
import { SearchResultsPage } from '@/pages/SearchResultsPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProductPage } from '@/pages/ProductPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage';
import { StorePage } from '@/pages/StorePage';

const basename = import.meta.env.VITE_SITE_BASENAME || '/';

const RootLayout = () => (
  <CategoriesProvider>
    <AddressesProvider>
      <CartProvider>
        <AuthExpiredListener>
          <Layout>
            <Outlet />
          </Layout>
        </AuthExpiredListener>
      </CartProvider>
    </AddressesProvider>
  </CategoriesProvider>
);

const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: '/search', element: <SearchResultsPage /> },
        { path: '/loja/:storeSlug', element: <StorePage /> },
        { path: '/product/:storeSlug/:productSlug', element: <ProductPage /> },
        { path: '/login', element: <LoginPage /> },
        { path: '/register', element: <RegisterPage /> },
        { path: '/forgot-password', element: <ForgotPasswordPage /> },
        { path: '/reset-password', element: <ResetPasswordPage /> },
        { path: '/change-password', element: <ChangePasswordPage /> },
        { path: '/profile', element: <ProfilePage /> },
        { path: '/cart', element: <CartPage /> },
        { path: '/checkout', element: <CheckoutPage /> },
        { path: '/order-confirmation', element: <OrderConfirmationPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename },
);

export const App = () => <RouterProvider router={router} />;
