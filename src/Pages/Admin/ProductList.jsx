import React from 'react'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const ProductList = () => {
  React.useEffect(() => {
    document.title = 'Product List';
    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  const data = [
    {
      productName: "abc",
      barcodeNumber: "11123456",
      isBarcode: 1,
      price: "20"
    },
    {
      productName: "xyz",
      barcodeNumber: "22223456",
      isBarcode: 1,
      price: "25"
    },
    {
      productName: "pqr",
      barcodeNumber: "33323456",
      isBarcode: 0,
      price: "30"
    }
  ];

  const totalPrice = data.reduce((sum, item) => sum + Number(item.price), 0);

  return (

    <div className="p-6 max-w-4xl mx-auto bg-white/40 mt-10 border rounded-xl shadow-xl">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">Product List</h1>
      
      <Table className="rounded-xl overflow-hidden shadow-md border border-gray-200">
        <TableCaption className="text-gray-500">A list of your products.</TableCaption>
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="w-[200px] text-gray-700">Product Name</TableHead>
            <TableHead className="text-gray-700">Barcode Number</TableHead>
            <TableHead className="text-gray-700">Is Barcode</TableHead>
            <TableHead className="text-right text-gray-700">Price ($)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((d, index) => (
            <TableRow key={index} className="hover:bg-gray-50 transition-colors">
              <TableCell className="font-medium text-gray-900">{d.productName}</TableCell>
              <TableCell className="text-gray-700">{d.barcodeNumber}</TableCell>
              <TableCell className="text-gray-700">{d.isBarcode ? 'Yes' : 'No'}</TableCell>
              <TableCell className="text-right text-gray-800 font-semibold">{d.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-gray-100">
            <TableCell colSpan={3} className="font-semibold text-gray-800">Total</TableCell>
            <TableCell className="text-right font-bold text-gray-900">{totalPrice}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

export default ProductList
