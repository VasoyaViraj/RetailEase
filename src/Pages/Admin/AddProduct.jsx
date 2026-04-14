import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { databases } from "@/services/appwriteConfig";
import confetti from "canvas-confetti";

const AddProduct = () => {

  useEffect(() => {
    document.title = 'Add Product';

    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  let [productData, setProductData] = useState({
    productName: "",
    barcode: "",
    costPrice: "",
    price: "",
    stock: ""
  })

  const handleClick = () => {
    const scalar = 2;
    const unicorn = confetti.shapeFromText({ text: "🦄", scalar });
 
    const defaults = {
      spread: 360,
      ticks: 60,
      gravity: 0,
      decay: 0.96,
      startVelocity: 20,
      shapes: [unicorn],
      scalar,
    };
 
    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 30,
      });
 
      confetti({
        ...defaults,
        particleCount: 5,
      });
 
      confetti({
        ...defaults,
        particleCount: 15,
        scalar: scalar / 2,
        shapes: ["circle"],
      });
    };
 
    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  };

  const handleSendToDatabase = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        productName: productData.productName,
        barcode: productData.barcode || Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        price: parseFloat(productData.price) || 0,
        costPrice: parseFloat(productData.costPrice) || 0,
        stock: parseInt(productData.stock, 10) || 0,
      };

      const res = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASEID,
        import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTIONID,
        'unique()',
        payload
      );
      
      console.log(res);
  
      if (res) {
        handleClick();
        setTimeout(() => {
          setProductData({
            productName: "",
            barcode: "",
            costPrice: "",
            price: "",
            stock: ""
          });
        }, 1500);
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen-48 swiss-dots" >
      <div className="w-full max-w-sm swiss-card bg-white">
        <div className="p-4 border-b-2 border-black">
          <h2 className="text-xl font-black uppercase tracking-tighter text-black" >Add Product</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSendToDatabase}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-black" htmlFor="productName">Product Name</label>
                <input
                  id="productName"
                  className="swiss-input p-3"
                  type="text"
                  placeholder="Enter Product Name"
                  value={productData.productName}
                  onChange={(e) => setProductData({...productData, productName : e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black" htmlFor="price">Price</label>
                  <input
                    id="price"
                    className="swiss-input p-3"
                    type="number"
                    step="0.01"
                    placeholder="Enter Product Price"
                    inputMode="decimal"
                    value={productData.price}
                    onChange={(e) => setProductData({...productData, price : e.target.value})}
                    required
                  />
              </div>
              <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black" htmlFor="costPrice">Cost Price</label>
                  <input
                    id="costPrice"
                    className="swiss-input p-3"
                    type="number"
                    step="0.01"
                    placeholder="Enter cost price"
                    inputMode="decimal"
                    value={productData.costPrice}
                    onChange={(e) => setProductData({...productData, costPrice : e.target.value})}
                    required
                  />
              </div>
              <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black" htmlFor="barcode">Barcode</label>
                  <input
                    id="barcode"
                    className="swiss-input p-3"
                    type="text"
                    placeholder="Enter Barcode (optional)"
                    value={productData.barcode}
                    onChange={(e) => setProductData({...productData, barcode : e.target.value})}
                  />
              </div>
              <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black" htmlFor="stock">Total Stocks</label>
                  <input
                    id="stock"
                    className="swiss-input p-3"
                    type="number"
                    placeholder="Enter total Stocks"
                    inputMode="numeric"
                    min="0"
                    value={productData.stock}
                    onChange={(e) => setProductData({...productData, stock : e.target.value})}
                    required
                  />
              </div>
            </div>
            <div className="mt-8 border-t-2 border-black pt-4">
              <button type="submit" className="w-full py-4 swiss-btn-primary">
                Add to Database
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddProduct
