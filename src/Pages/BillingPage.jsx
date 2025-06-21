import { useState, useRef, useEffect, useContext } from "react"
import { Search, Trash2, Plus, Minus, Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { allProductsContext } from "@/contexts/allProductsContext"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import BarcodeScannerComponent from "react-qr-barcode-scanner"
import { databases } from "@/services/appwriteConfig"
import confetti from "canvas-confetti";

export default function BillingPage() {

  useEffect(() => {
    document.title = 'Billing Page';

    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  const {data: products, setData: setProducts} = useContext(allProductsContext)

  const [searchTerm, setSearchTerm] = useState("")
  const [billItems, setBillItems] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [stockError, setStockError] = useState("")

  // Card Animation States
  const [animatingCards, setAnimatingCards] = useState({})

  let [cusName, setCusName] = useState('')
  let [cusMobNum, setCusMobNum] = useState(null)

  // Scanner Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [openCamera, setOpenCamera] = useState(false)
  const [scannedItem, setScannedItem] = useState("")
  const [error, setError] = useState("")
  const [zoom, setZoom] = useState(5)
  
  const searchInputRef = useRef(null)
  const videoRef = useRef(null)
  const hasScanned = useRef(false)

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      product.barcodeNumber.toString().includes(searchTerm.trim()),
  )

  useEffect(() => {
    setSelectedIndex(filteredProducts.length > 0 ? 0 : -1)
  }, [filteredProducts.length])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F1") {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      if (document.activeElement !== searchInputRef.current) return

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault()
        if (filteredProducts.length > 0) {
          setSelectedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev))
        }
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
          triggerCardAnimation(filteredProducts[selectedIndex].$id)
          addToBill(filteredProducts[selectedIndex])
          setSearchTerm("")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [filteredProducts, selectedIndex])

  // Animation function
  const triggerCardAnimation = (cardId) => {
    setAnimatingCards(prev => ({ ...prev, [cardId]: true }))
    setTimeout(() => {
      setAnimatingCards(prev => ({ ...prev, [cardId]: false }))
    }, 550)
  }

  // Scanner Functions
  const search = (array, number) => {
    const foundItem = array.find(item => item.barcodeNumber == number);
    if (foundItem) {
      return foundItem;
    } else {
      return null;
    }
  }

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

  // Add product to bill
  const addToBill = (product) => {
    // Check if product is in stock
    if (product.stock <= 0) {
      setStockError(`Sorry, ${product.productName} is out of stock`)
      setTimeout(() => setStockError(""), 3000)
      return
    }

    setBillItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.$id === product.$id)

      if (existingItemIndex >= 0) {
        // Check if adding one more would exceed stock
        if (prevItems[existingItemIndex].quantity >= product.stock) {
          setStockError(`Only ${product.stock} units of ${product.productName} available`)
          setTimeout(() => setStockError(""), 3000)
          return prevItems
        }

        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        }
        return updatedItems
      } else {
        return [
          ...prevItems,
          {
            $id: product.$id,
            productName: product.productName,
            price: product.price,
            quantity: 1,
            stock: product.stock, // Keep track of available stock
            buyingPrice : product.buyingPrice
          },
        ]
      }
    })
  }

  const updateQuantity = ($id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromBill($id)
      return
    }

    // Find the product to check stock
    const product = products.find(p => p.$id === $id)
    if (product && newQuantity > product.stock) {
      setStockError(`Only ${product.stock} units of ${product.productName} available`)
      setTimeout(() => setStockError(""), 3000)
      return
    }

    setBillItems((prevItems) => prevItems.map((item) => (item.$id === $id ? { ...item, quantity: newQuantity } : item)))
  }

  const handleQuantityChange = ($id, value) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      updateQuantity($id, numValue)
    }
  }

  const removeFromBill = ($id) => {
    setBillItems((prevItems) => prevItems.filter((item) => item.$id !== $id))
  }

  const totalBill = billItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const netProfit = totalBill - billItems.reduce((sum, item) => sum + item.buyingPrice * item.quantity, 0)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    }).format(amount)
    // return `${parseFloat(amount).toFixed(2)}`
  }

  const checkoutFun = async () => {

    console.log(billItems)
    // Validate bill items
    if (billItems.length === 0) {
      setStockError("Please add items to the bill")
      setTimeout(() => setStockError(""), 3000)
      return
    }

    // Validate customer details
    if (!cusName || !cusMobNum) {
      setStockError("Please enter customer details")
      setTimeout(() => setStockError(""), 3000)
      return
    }

    try {
      for (const item of billItems) {
        const product = products.find(p => p.$id === item.$id)
        if (!product) {
          throw new Error(`Product not found: ${item.productName}`)
        }

        const newStock = product.stock - item.quantity
        if (newStock < 0) {
          throw new Error(`Insufficient stock for ${product.productName}`)
        }

        await databases.updateDocument(
          '6810918b0009c28b3b9d',
          '6810919e003221b85c31',
          product.$id,
          {
            stock: newStock
          }
        )
      }

      await databases.createDocument(
        '6810918b0009c28b3b9d',
        '685586b10032ef98eed5',
        'unique()',
        {
          'oderValue': totalBill,
          'profit' : netProfit,
          'orderItems' : JSON.stringify(billItems),
          cusName,
          cusMobNum,
          date : new Date().getTime()
        }
      )

      // Update local state
      setProducts(prevProducts => 
        prevProducts.map(product => {
          const billItem = billItems.find(item => item.$id === product.$id)
          if (billItem) {
            return {
              ...product,
              stock: product.stock - billItem.quantity
            }
          }
          return product
        })
      )
      
      // Clear bill and customer info
      setBillItems([])
      setCusName('')
      setCusMobNum('')
      setSearchTerm('')

      handleConfetti()
      // Show success message
    } catch (error) {
      console.error('Error:', error)
      setStockError(error.message)
      setTimeout(() => setStockError(""), 3000)
    }
  }

  const generatePDF = async () => {

    try {
      // Generate PDF
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(24)
      doc.text('RetailEase', 20, 20)
      doc.setFontSize(20)
      doc.text('INVOICE', 20, 35)

      // Customer Details
      doc.setFontSize(12)
      doc.text('Bill To:', 20, 65)
      doc.setFontSize(11)
      doc.text(`Name: ${cusName}`, 20, 72)
      doc.text(`Phone: ${cusMobNum}`, 20, 78)

      // Invoice Details
      doc.setFontSize(12)
      doc.text('Invoice Details:', 120, 65)
      doc.setFontSize(11)
      const invoiceNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      doc.text(`Invoice No: ${invoiceNumber}`, 120, 72)
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 78)

      // Table Header
      const tableColumn = ["Product", "Unit Price", "Quantity", "Subtotal"]
      const tableRows = billItems.map((product) => [
        product.productName,
        formatCurrency(product.price),
        product.quantity,
        formatCurrency(product.price * product.quantity),
      ])

      // Add total row
      tableRows.push(['', '', 'Total:', formatCurrency(totalBill)])

      // Generate table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 95,
        margin: { left: 20, right: 20 },
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 66, 66] }
      })

      // Convert PDF to base64
      const pdfData = doc.output('datauristring')

      // Open PDF in new window
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoiceNumber}</title>
            <style>
              body, html {
                margin: 0;
                padding: 0;
                height: 100%;
                overflow: hidden;
              }
              iframe {
                width: 100%;
                height: 100vh;
                border: none;
              }
            </style>
          </head>
          <body>
            <iframe src="${pdfData}"></iframe>
          </body>
        </html>
      `)
      printWindow.document.close()

    } catch (error) {
      console.error('Error:', error)
      alert('Error generating bill. Please try again.')
    }
  }

  const sendWhatsApp = () => {
    if (!cusMobNum) {
      setStockError("Please enter customer's mobile number")
      setTimeout(() => setStockError(""), 3000)
      return
    }

    if (billItems.length === 0) {
      setStockError("Please add items to the bill")
      setTimeout(() => setStockError(""), 3000)
      return
    }

    // Format the bill message
    const billMessage = `*RetailEase - Bill*\n\n` +
      `*Customer:* ${cusName || 'N/A'}\n` +
      `*Date:* ${new Date().toLocaleDateString()}\n\n` +
      `*Items:*\n` +
      billItems.map(item => 
        `• ${item.productName}\n` +
        `  Qty: ${item.quantity} × ₹${item.price.toFixed(2)} = ₹${(item.quantity * item.price).toFixed(2)}`
      ).join('\n\n') +
      `\n\n*Total Amount:* ₹${totalBill.toFixed(2)}\n\n` +
      `Thank you for shopping with us!`

    // Format the phone number (remove any spaces or special characters)
    const phoneNumber = cusMobNum.replace(/[^0-9]/g, '')
    
    // Create WhatsApp URL with the message
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(billMessage)}`
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank')
  }

  const handleScannerResult = (err, result) => {
    if (result && !hasScanned.current) {
      hasScanned.current = true;
      setScannedItem(result.text);
      
      // Search for the product and add to bill
      const foundProduct = search(products, result.text);
      if (foundProduct) {
        triggerCardAnimation(foundProduct.$id);
        addToBill(foundProduct);
        setError("");
        // Show success message briefly, then reset for next scan
        setTimeout(() => {
          setScannedItem("");
          hasScanned.current = false;
        }, 1500);
      } else {
        setError("Product not found with this barcode");
        setTimeout(() => {
          setScannedItem("");
          setError("");
          hasScanned.current = false;
        }, 2000);
      }
    }
  };

  const resetScannerState = () => {
    setOpenCamera(false);
    setScannedItem("");
    setError("");
    setZoom(5);
    hasScanned.current = false;
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetScannerState();
  };

  const handleConfetti = () => {
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

  // Update the product card to show stock status with animation
  const renderProductCard = (product, index) => (
    <div
      key={product.$id}
      className={`relative overflow-hidden cursor-pointer rounded-lg border transition-all duration-200 ease-in-out transform hover:scale-[1.05] ${
        index === selectedIndex 
          ? "bg-blue-100 border-gray-200 hover:border-blue-200 hover:shadow-sm" 
          : "bg-white border-gray-200 hover:border-blue-200 hover:shadow-md"
      }`}
      onClick={() => {
        triggerCardAnimation(product.$id);
        addToBill(product);
      }}
    >
      {/* Animated background overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 transform transition-transform duration-[500ms] ease-out ${
          animatingCards[product.$id] ? 'translate-x-0' : '-translate-x-full'
        }`}
      />

      <div className="relative z-10 p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className={`font-medium line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 ${
              animatingCards[product.$id] ? 'text-white' : 'text-gray-900'
            }`}>
              {product.productName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full transition-colors duration-300 ${
                animatingCards[product.$id] 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                #{product.barcodeNumber}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full transition-colors duration-300 ${
                animatingCards[product.$id]
                  ? 'bg-white/20 text-white'
                  : product.stock > 10 
                    ? 'bg-green-100 text-green-600' 
                    : product.stock > 0 
                      ? 'bg-yellow-100 text-yellow-600' 
                      : 'bg-red-100 text-red-600'
              }`}>
                {product.stock > 0 ? `${product.stock}` : 'Out of stock'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          {product.description && (
            <p className={`text-sm line-clamp-2 transition-colors duration-300 ${
              animatingCards[product.$id] ? 'text-white/90' : 'text-gray-500'
            }`}>
              {product.description}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="flex flex-col">
            <span className={`text-lg font-semibold transition-colors duration-300 ${
              animatingCards[product.$id] 
                ? 'text-white' 
                : 'text-blue-600 group-hover:text-blue-700'
            }`}>
              ₹{product.price.toFixed(2)}
            </span>
            {product.mrp && product.mrp > product.price && (
              <span className={`text-xs line-through transition-colors duration-300 ${
                animatingCards[product.$id] ? 'text-white/70' : 'text-gray-400'
              }`}>
                MRP: ₹{product.mrp.toFixed(2)}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`transition-all duration-200 ease-in-out transform hover:scale-105 ${
              animatingCards[product.$id]
                ? 'text-white hover:text-white hover:bg-white/20'
                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            ➕
          </Button>
        </div>
      </div>
    </div>
  )

  // Update the quantity input in the bill table
  const renderQuantityInput = (item) => (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 border-gray-200 hover:bg-gray-50 transition-all duration-200 ease-in-out transform hover:scale-110"
        onClick={(e) => {
          e.stopPropagation()
          updateQuantity(item.$id, item.quantity - 1)
        }}
      >
        <Minus className="h-4 w-4 text-gray-600" />
      </Button>
      <Input
        type="number"
        value={item.quantity}
        onChange={(e) => handleQuantityChange(item.$id, e.target.value)}
        className="w-16 text-center px-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
        step="1"
        min="1"
        max={item.stock}
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 border-gray-200 hover:bg-gray-50 transition-all duration-200 ease-in-out transform hover:scale-110"
        onClick={(e) => {
          e.stopPropagation()
          updateQuantity(item.$id, item.quantity + 1)
        }}
      >
        <Plus className="h-4 w-4 text-gray-600" />
      </Button>
    </div>
  )

  return (
    <div className=" w-full mx-auto p-4 pt-0 h-screen-48">  
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Product Search Section */}
        <Card className="flex-1 min-w-0 bg-white shadow-lg rounded-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-semibold text-gray-800">Product Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stockError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                {stockError}
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search products by name or category..."
                  className="pl-8 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  ref={searchInputRef}
                />
              </div>
              
              {/* Scanner Dialog Button */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title="Scan Barcode"
                    className="border-gray-200 hover:bg-gray-50"
                    onClick={() => {
                      setIsDialogOpen(true);
                      setOpenCamera(true);
                      setError('');
                      hasScanned.current = false;
                    }}
                  >
                    <Camera className="h-4 w-4 text-gray-600" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center">📦 Scan Product Barcode</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {openCamera && (
                      <div className="space-y-2">
                        <div className="rounded-md overflow-hidden">
                          <BarcodeScannerComponent
                            width="100%"
                            height={250}
                            onUpdate={handleScannerResult}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                          <Button variant="outline" size="sm" onClick={handleZoomIn}>
                             ➖ Zoom Out
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleZoomOut}>
                          ➕ Zoom In
                          </Button>
      
                        </div>

                        <div className="text-center text-muted-foreground text-sm">
                          🔍 Zoom Level: {zoom.toFixed(1)}x
                        </div>
                      </div>
                    )}

                    {!openCamera && (
                      <div className="text-center">
                        <Button 
                          className="w-full" 
                          onClick={() => { 
                            setOpenCamera(true); 
                            setError(''); 
                            hasScanned.current = false; 
                          }}
                        >
                          📷 Start Camera
                        </Button>
                      </div>
                    )}

                    {error && (
                      <div className="text-center text-red-500 text-sm font-medium">
                        ❌ {error}
                      </div>
                    )}

                    {scannedItem && (
                      <div className="text-center text-green-600 text-sm font-medium">
                        ✅ Added to Bill: {scannedItem}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleDialogClose} className="flex-1">
                        Close Scanner
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <p className="text-xs text-gray-500">
              Press F1 to focus search. Use ↑/↓ to navigate results and Enter to add to bill.
            </p>

            <div className="border border-gray-200 rounded-lg overflow-auto max-h-[calc(100vh-280px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 pr-20 lg:pr-0 overflow-hidden">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => renderProductCard(product, index))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-400 mb-2">
                      <Search className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 text-lg">No products found matching your search.</p>
                    <p className="text-gray-400 text-sm mt-1">Try different keywords or categories</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 italic">Click on a product to add it to the bill</p>
          </CardContent>
        </Card>

        {/* Bill Section */}
        <Card className="flex-1 min-w-0 bg-white shadow-lg rounded-lg">
          <CardHeader className="flex justify-between items-center border-b p-6 pt-0">

            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-center gap-4 flex-col lg:flex-row">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Customer Name</label>
                  <Input 
                    className='w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500' 
                    placeholder='Enter customer name' 
                    onChange={(e) => setCusName(e.target.value)} 
                    value={cusName}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Mobile Number</label>
                  <Input 
                    className='w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500' 
                    placeholder='Enter mobile number' 
                    type='number'
                    onChange={(e) => setCusMobNum(e.target.value)} 
                    value={cusMobNum}
                  />
                </div>
              </div>
              <div className="flex gap-2 items-start text-[14px] lg:text-[17px] cursor-pointer">
                <span className=" text-gray-500">Date:</span>
                <span 
                  className=" font-medium text-gray-700" 
                  onClick={() => {
                    setCusName('*RetailEase')
                    setCusMobNum(1010102020)
                }}>
                  {new Date().toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>


            <div className="flex flex-col gap-2 ml-6">
              <Button 
                className='w-full bg-neutral-600 hover:bg-neutral-400 flex items-center justify-evenly gap-2'
                onClick={checkoutFun}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 16V3M12 3L16 7.375M12 3L8 7.375" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Checkout
              </Button>
              <Button 
                className='w-full bg-green-600 hover:bg-green-700 flex items-center justify-evenly gap-2'
                onClick={sendWhatsApp}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </Button>
              <Button 
                className='w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-evenly gap-2' 
                onClick={generatePDF}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Generate PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="text-gray-600 font-medium">Product</TableHead>
                    <TableHead className="text-center text-gray-600 font-medium">Quantity</TableHead>
                    <TableHead className="text-right text-gray-600 font-medium">Unit Price</TableHead>
                    <TableHead className="text-right text-gray-600 font-medium">Subtotal</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billItems.length > 0 ? (
                    billItems.map((item) => (
                      <TableRow key={item.$id} className="hover:bg-gray-50">
                        <TableCell className="font-medium py-3 text-gray-700">{item.productName}</TableCell>
                        <TableCell className="py-3">
                          {renderQuantityInput(item)}
                        </TableCell>
                        <TableCell className="text-right py-3 text-gray-700">₹{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right py-3 text-gray-700 font-medium">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell className="py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50 transition-all duration-200 ease-in-out transform hover:scale-110"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFromBill(item.$id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center text-gray-500">
                          <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                          </svg>
                          <p className="text-lg font-medium">No items added to the bill yet</p>
                          <p className="text-sm mt-1">Add products from the search section</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {billItems.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Total Amount</span>
                  <span className="text-2xl font-bold text-gray-900">₹{totalBill.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}