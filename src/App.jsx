import BillingPage from './Pages/BillingPage';
import AddProduct from './Pages/Admin/AddProduct';
import ProductList from './Pages/Admin/ProductList';
import ScanProduct from './Pages/Admin/ScanProduct';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"; // Import useLocation
import Navbarr from './components/Navbarr';
import { AllProductsProvider } from './contexts/allProductsContext';
import Dashboard from './Pages/Admin/Dashboard';

function App() {
  return(
    <>
    <AllProductsProvider>
      <BrowserRouter>
        <AppContent /> 
      </BrowserRouter>
    </AllProductsProvider>
    </>
  )
}

function AppContent() { 
  const location = useLocation();

  const noNavbarPaths = ['/dashboard']; 

  return (
    <>
      {!noNavbarPaths.includes(location.pathname) && <Navbarr />} 
      <Routes>
        <Route path="/" element={<BillingPage/>} />
        <Route path="/admin/addproduct" element={<AddProduct/> }/>
        <Route path="/admin/productlist" element={<ProductList/> }/>
        <Route path="/admin/scanproduct" element={<ScanProduct/> }/>
        <Route path="/dashboard" element={<Dashboard/> }/>
      </Routes>
    </>
  );
}

export default App;