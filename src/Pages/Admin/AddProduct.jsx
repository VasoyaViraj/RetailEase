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
    "productName" : "",
    "barcodeNumber" : null,
    "price" : null,
    "stock" : null
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

  const handleSendToDatabase = async () => {
    try {
      const res = await databases.createDocument(
        '6810918b0009c28b3b9d',
        '6810919e003221b85c31',
        'unique()',
        productData
      );
      console.log(res);
  
      if (res) {
        handleClick();
        setTimeout(() => {
          window.location.reload()
        }, 1500);
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen-48" >
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-bold border-b-2 pb-3"  >Add Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Product Name</Label>
                <Input
                  id="productName"
                  type="text"
                  placeholder="Enter Product Name"
                  value={productData.productName}
                  onChange={(e) => setProductData({...productData, "productName" : e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="password">Price</Label>
                  <Input
                    id="price"
                    type="text"
                    placeholder="Enter Product Price"
                    inputMode="numeric"
                    value={productData.price}
                    onChange={(e) => setProductData({...productData, "price" : parseFloat(e.target.value)})}
                    required
                  />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="password">Barcode Number</Label>
                  <Input
                    id="barcodeNumber"
                    type="text"
                    placeholder="Enter Barcode Number"
                    inputMode="numeric"
                    value={productData.barcodeNumber}
                    onChange={(e) => setProductData({...productData, "barcodeNumber" : parseInt(e.target.value)})}
                  />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="stock">Total Stocks</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="Enter total Stocks in store"
                    inputMode="numeric"
                    min="0"
                    value={productData.stock}
                    onChange={(e) => setProductData({...productData, "stock" : parseInt(e.target.value) || 0})}
                    required
                  />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" onClick={handleSendToDatabase} className="w-full">
            Add to Database
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default AddProduct
