import BillingPage from './Pages/BillingPage';
import AddProduct from './Pages/Admin/AddProduct';
import ProductList from './Pages/Admin/ProductList';
import ScanProduct from './Pages/Admin/ScanProduct';
import Dashboard from './Pages/Admin/Dashboard';
import Login from './Pages/Auth/Login';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbarr from './components/Navbarr';
import { AllProductsProvider } from './contexts/allProductsContext';
import { AuthProvider } from './providers/AuthProvider';
import RequireRole from './components/RequireRole';
import RequireCustomerAuth from './components/RequireCustomerAuth';

function App() {
  return(
    <>
    <AuthProvider>
      <AllProductsProvider>
        <BrowserRouter>
          <AppContent /> 
        </BrowserRouter>
      </AllProductsProvider>
    </AuthProvider>
    </>
  )
}

function AppContent() { 
  const location = useLocation();

  const noNavbarPaths = ['/dashboard', '/login']; 

  return (
    <>
      {!noNavbarPaths.includes(location.pathname) && <Navbarr />} 
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login/>} />

        {/* Staff routes — require cashier or owner */}
        <Route path="/" element={
          <RequireRole roles={['cashier','owner']}>
            <BillingPage/>
          </RequireRole>
        } />
        <Route path="/admin/addproduct" element={
          <RequireRole roles={['cashier','owner']}>
            <AddProduct/>
          </RequireRole>
        } />
        <Route path="/admin/productlist" element={
          <RequireRole roles={['cashier','owner']}>
            <ProductList/>
          </RequireRole>
        } />
        <Route path="/admin/scanproduct" element={
          <RequireRole roles={['cashier','owner']}>
            <ScanProduct/>
          </RequireRole>
        } />
        <Route path="/dashboard" element={
          <RequireRole roles={['cashier','owner']}>
            <Dashboard/>
          </RequireRole>
        } />

        {/* Customer routes */}
        <Route path="/customer/profile" element={
          <RequireCustomerAuth>
            <div className="flex items-center justify-center h-screen">
              <p className="text-gray-500">Customer Profile — coming in Commit 7</p>
            </div>
          </RequireCustomerAuth>
        } />
      </Routes>
    </>
  );
}

export default App;