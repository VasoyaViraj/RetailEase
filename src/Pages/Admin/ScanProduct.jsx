import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

function ScanProduct() {

  useEffect(() => {
    document.title = 'Scan Product';

    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  //temporary
  const List = [
    {
      "productName" : "Parle G",
      "barcodeNumber" : "1234561",
      "price" :  20,
    },
    {
      "productName" : "Condom",
      "barcodeNumber" : "1234562",
      "price" :  50,
    },
    {
      "productName" : "Balaji wafer",
      "barcodeNumber" : "1234563",
      "price" :  40,
    },
    {
      "productName" : "Waffle",
      "barcodeNumber" : "1234564",
      "price" :  200,
    },
    {
      "productName" : "Tomato",
      "barcodeNumber" : "1234565",
      "price" :  22,
    },
  ]

  const [scannedItem, setScannedItem] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [name, setName] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [openCamera, setOpenCamera] = useState(false);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(5);

  const videoRef = useRef(null);
  const hasScanned = useRef(false);

  const handleCalculate = () => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(pricePerKg) || 0;
    setCalculatedPrice(qty * price);
  };

  const handleSendToDatabase = () => {
    const data = {
      item: scannedItem,
      productName,
      quantity,
      pricePerKg,
      totalPrice: calculatedPrice,
    };
    console.log("Sending to database:", data);
  };

  const handleZoomIn = () => {
    setZoom((prev) => {
      const newZoom = Math.min(prev + 0.5, 5);
      applyCameraSettings(newZoom);
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      applyCameraSettings(newZoom);
      return newZoom;
    });
  };

  const applyCameraSettings = (newZoom) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const [track] = videoRef.current.srcObject.getVideoTracks();
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        const constraints = {};
        if (capabilities.zoom) {
          Object.assign(constraints, { advanced: [{ zoom: newZoom }] });
        }
        track.applyConstraints(constraints).catch((e) => console.error("Error applying constraints", e));
      }
    }
  };

  useEffect(() => {
    if (openCamera) {
      const interval = setInterval(() => {
        const video = document.querySelector('video');
        if (video && video.srcObject) {
          videoRef.current = video;
          applyCameraSettings(zoom);
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [openCamera]);

  return (
    <div className="flex h-screen-48 items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">📦 Scan & Add Product</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!openCamera && (
            <Button className="w-full" onClick={() => { setOpenCamera(true); setError(''); hasScanned.current = false; }}>
              📷 Open Camera
            </Button>
          )}

          {openCamera && (
            <div className="space-y-2">
              <div className="rounded-md overflow-hidden">
                <BarcodeScannerComponent
                  width="100%"
                  height={250}
                  onUpdate={(err, result) => {
                    if (result && !hasScanned.current) {
                      hasScanned.current = true;
                      setScannedItem(result.text);
                      setOpenCamera(false);
                      const data = search(List, result.text);
                      setProductName(data[0]);
                      setPricePerKg(data[1]);
                      setError("");
                    }
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <Button variant="outline" onClick={handleZoomIn}>➕ Zoom In</Button>
                <Button variant="outline" onClick={handleZoomOut}>➖ Zoom Out</Button>
                <Button variant="destructive" onClick={() => { setOpenCamera(false); setError(''); }}>
                  ❌ Close Camera
                </Button>
              </div>

              <div className="text-center text-muted-foreground text-sm">
                🔍 Zoom Level: {zoom.toFixed(5)}x
              </div>
            </div>
          )}

          {error && (
            <div className="text-center text-red-500">{error}</div>
          )}

          <Input
            placeholder="Enter Customer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            placeholder="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />

          <Input
            placeholder="Scanned Barcode Item"
            value={scannedItem}
            onChange={(e) => setScannedItem(e.target.value)}
          />

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Price / Kg"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
            />
          </div>

          <Button onClick={handleCalculate} className="w-full">
            🧮 Calculate Price
          </Button>

          {calculatedPrice > 0 && (
            <div className="text-center font-semibold text-green-600">
              ✅ Total Price: ₹{calculatedPrice}
            </div>
          )}

          <Button variant="outline" onClick={handleSendToDatabase} className="w-full">
            📤 Send to Database
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}

function search(array, number) {
  const foundItem = array.find(item => item.barcodeNumber == number);
  if (foundItem) {
    return [foundItem.productName, foundItem.price];
  } else {
    return ["", ""];
  }
}

export default ScanProduct;