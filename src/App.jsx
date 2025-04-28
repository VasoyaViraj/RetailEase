import BillingPage from './Pages/BillingPage';
import AddProduct from './Pages/Admin/AddProduct';
import ProductList from './Pages/Admin/ProductList';
import ScanProduct from './Pages/Admin/ScanProduct';
import { BrowserRouter, Routes, Route} from "react-router-dom";
import Navbarr from './components/Navbarr';

function App() {
  return(
    <>
      <BrowserRouter>
      <Navbarr/>
        <Routes>
          <Route path="/" element={<BillingPage/>} />
          <Route path="/admin/addproduct" element={<AddProduct/> }/>
          <Route path="/admin/productlist" element={<ProductList/> }/>
          <Route path="/admin/scanproduct" element={<ScanProduct/> }/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App