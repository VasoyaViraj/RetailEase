import { useState, useRef, useEffect, useContext } from "react"
import { Search, Trash2, Plus, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { allProductsContext } from "@/contexts/allProductsContext"

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

  const searchInputRef = useRef(null)

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

  return (
    <div className="w-full mx-auto p-4 h-screen-48">  
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Product Search Section */}
        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle>Product Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
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
                        <TableCell className="text-right py-1.5">${product.price.toFixed(2)}</TableCell>
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
        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle>Bill</CardTitle>
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
                        <TableCell className="text-right py-1.5">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right py-1.5">${(item.price * item.quantity).toFixed(2)}</TableCell>
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
                  <span className="font-bold text-xl">${totalBill.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}