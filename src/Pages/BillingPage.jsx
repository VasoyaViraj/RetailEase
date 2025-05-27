import { useState, useRef, useEffect, useContext } from "react"
import { Search, Trash2, Plus, Minus, Barcode, Camera, CameraOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { allProductsContext } from "@/contexts/allProductsContext"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import BarcodeScannerComponent from "react-qr-barcode-scanner"

export default function BillingPage() {

  useEffect(() => {
    document.title = 'Billing Page';

    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  const {data: products} = useContext(allProductsContext)

  const [searchTerm, setSearchTerm] = useState("")
  const [billItems, setBillItems] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)

  let [cusName, setCusName] = useState('')
  let [cusMobNum, setCusMobNum] = useState(null)

  const searchInputRef = useRef(null)

  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [zoom, setZoom] = useState(5)
  const hasScanned = useRef(false)
  const scanTimeout = useRef(null)
  const videoRef = useRef(null)

  // Add search function
  const searchProduct = (array, barcode) => {
    const foundItem = array.find(item => item.barcodeNumber == barcode)
    if (foundItem) {
      return [foundItem.productName, foundItem.price]
    } else {
      return ["", ""]
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase())
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

      if (e.key === "ArrowDown") {
        e.preventDefault()
        if (filteredProducts.length > 0) {
          setSelectedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev))
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
          addToBill(filteredProducts[selectedIndex])
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [filteredProducts, selectedIndex])

  // Add product to bill
  const addToBill = (product) => {
    setBillItems((prevItems) => {

      const existingItemIndex = prevItems.findIndex((item) => item.$id === product.$id)

      if (existingItemIndex >= 0) {

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    }).format(amount)
    // return `${parseFloat(amount).toFixed(2)}`
  }

  const generatePDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(30)
    doc.text('INVOICE', 20,20)

    doc.setFontSize(13)
    doc.text('ISSUED TO:', 20,41)
    doc.text(cusName, 20,50)
    doc.text(cusMobNum, 20,57)

    doc.text('Invoice no. : 01238',150 ,41)
    doc.text('Date : '+new Date().toLocaleDateString(),150 ,48)

    const tableColumn = ["Product", "Unit Price", "Quantity", "Subtotal"]
    const tableRows = billItems.map((product) => [
    product.productName,
    formatCurrency(product.price),
    product.quantity,
    formatCurrency(product.price*product.quantity),
    ])

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        margin : 20,
        theme: "striped",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 66, 66] },
    })

    const finalY = (doc).lastAutoTable.finalY || 120
    doc.text("Total:", 137, finalY + 10)
    const totalWidth = doc.getTextWidth("Total:")
    doc.text(formatCurrency(totalBill), totalWidth+139, finalY + 10)

    doc.setFontSize(12)
    doc.text("Thank you for shopping !", 105, finalY + 25, { align: "center" })
    
    doc.setFontSize(10)
    doc.text("Developed by Apexion Tech Solution", 142,287)
    doc.text("Contact us : 7016960514", 142,292)

    doc.save("invoice.pdf")
    return doc
}

  const handleWhatsAppShare = () => {
    if (!cusMobNum) {
      alert("Please enter customer's mobile number")
      return
    }

    const doc = generatePDF()
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    
    // Format the message
    const message = `Hello ${cusName || 'Valued Customer'},\n\nThank you for your purchase. Please find your invoice attached.\n\nTotal Amount: ${formatCurrency(totalBill)}\n\nBest regards,\nRetailEase`
    
    // Create WhatsApp app URL
    const whatsappUrl = `whatsapp://send?phone=${cusMobNum}&text=${encodeURIComponent(message)}`
    
    // Open WhatsApp app
    window.location.href = whatsappUrl
  }

  const handleZoomIn = () => {
    setZoom((prev) => {
      const newZoom = Math.min(prev + 0.5, 5)
      applyCameraSettings(newZoom)
      return newZoom
    })
  }

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1)
      applyCameraSettings(newZoom)
      return newZoom
    })
  }

  const applyCameraSettings = (newZoom) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const [track] = videoRef.current.srcObject.getVideoTracks()
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities()
        const constraints = {}
        if (capabilities.zoom) {
          Object.assign(constraints, { advanced: [{ zoom: newZoom }] })
        }
        track.applyConstraints(constraints).catch((e) => console.error("Error applying constraints", e))
      }
    }
  }

  // Function to handle successful scan
  const handleSuccessfulScan = (scannedProduct) => {
    addToBill(scannedProduct)
    setCameraError("Product added successfully!")
    setIsScanning(false) // Close scanner immediately
    hasScanned.current = false
  }

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current)
      }
    }
  }, [])

  const openScanner = () => {
    setIsScanning(true)
    setCameraError(null)
    hasScanned.current = false
  }

  const closeScanner = () => {
    setIsScanning(false)
    setCameraError(null)
    hasScanned.current = false
    if (scanTimeout.current) {
      clearTimeout(scanTimeout.current)
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject
      const tracks = stream.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      closeScanner()
    }
  }, [])

  return (
    <div className="w-full mx-auto p-4 h-screen-48">  
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Product Search Section */}
        <Card className="flex-1 min-w-0 bg-white/75">
          <CardHeader className="pb-2">
            <CardTitle>Product Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products by name or category..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  ref={searchInputRef}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={isScanning ? closeScanner : openScanner}
                className="shrink-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : isScanning ? (
                  <CameraOff className="h-4 w-4" />
                ) : (
                  <Barcode className="h-4 w-4" />
                )}
              </Button>
            </div>

            {isScanning && (
              <div className="relative border rounded-md overflow-hidden bg-black">
                <div className="relative">
                  <BarcodeScannerComponent
                    width="100%"
                    height={150}
                    onUpdate={(err, result) => {
                      if (result && !hasScanned.current) {
                        hasScanned.current = true
                        const scannedProduct = products.find(p => p.barcodeNumber === result.text)
                        if (scannedProduct) {
                          handleSuccessfulScan(scannedProduct)
                        } else {
                          setCameraError("Product not found")
                          setTimeout(() => {
                            hasScanned.current = false
                          }, 1000)
                        }
                      }
                    }}
                  />
                </div>
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    className="h-6 px-2 bg-white/20 hover:bg-white/30"
                  >
                    ➕
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    className="h-6 px-2 bg-white/20 hover:bg-white/30"
                  >
                    ➖
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={closeScanner}
                    className="h-6 px-2 bg-red-500 hover:bg-red-600"
                  >
                    Close
                  </Button>
                </div>
                <div className="absolute top-1 left-1 text-white text-xs bg-black/50 px-1.5 py-0.5 rounded">
                  Scan
                </div>
                <div className="absolute top-1 right-1 text-white text-xs bg-black/50 px-1.5 py-0.5 rounded">
                  {zoom.toFixed(1)}x
                </div>
              </div>
            )}

            {cameraError && (
              <div className={`text-center text-xs p-1 rounded ${
                cameraError.includes("successfully") 
                  ? "text-green-500 bg-green-50" 
                  : "text-red-500 bg-red-50"
              }`}>
                {cameraError}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Press F1 to focus search. Use ↑/↓ to navigate results and Enter to add to bill.
            </p>

            <div className="border rounded-md overflow-auto max-h-[calc(100vh-280px)]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="hover:bg-background">
                    <TableHead>Name</TableHead>
                    {/* <TableHead>Category</TableHead> */}
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Barcode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => (
                      <TableRow
                        key={product.$id}
                        className={`cursor-pointer py-0 ${
                          index === selectedIndex ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-muted/50"
                        }`}
                        onClick={() => addToBill(product)}
                      >
                        <TableCell className="font-medium py-1.5">{product.productName}</TableCell>
                        {/* <TableCell className="py-1.5">{product.category}</TableCell> */}
                        <TableCell className="text-right py-1.5">₹{product.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right py-1.5">{product.barcodeNumber}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No products found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground italic">Click on a product to add it to the bill</p>
          </CardContent>
        </Card>

        {/* Bill Section */}
        <Card className="flex-1 min-w-0 bg-white/75">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className='flex-2 flex gap-1 flex-col'>
              <Input className='w-3/4' placeholder='Customer Name' onChange={(e) => setCusName(e.target.value)} />
              <Input className='w-3/4' placeholder='Customer Mobile Number' onChange={(e) => setCusMobNum(e.target.value)} />
            </CardTitle>
            <div className="flex justify-center items-center flex-col gap-1">
              <Button className='w-full' onClick={handleWhatsAppShare}>Whatsapp</Button>
              <Button className='w-full' onClick={generatePDF}>Generate PDF</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-auto max-h-[calc(100vh-250px)]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="hover:bg-background">
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billItems.length > 0 ? (
                    billItems.map((item) => (
                      <TableRow key={item.$id}>
                        <TableCell className="font-medium py-1.5">{item.productName}</TableCell>
                        <TableCell className="py-1.5">
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(item.$id, item.quantity - 1)
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.$id, e.target.value)}
                              className="w-14 text-center px-1"
                              step="0.01"
                              min="0"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(item.$id, item.quantity + 1)
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-1.5">₹{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right py-1.5">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell className="py-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
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
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No items added to the bill yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {billItems.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-xl">₹{totalBill.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}