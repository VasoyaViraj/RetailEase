import {useContext, useEffect, useState} from 'react'
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
import {ComboboxDemo} from '@/components/combobox'
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { allProductsContext } from '@/contexts/allProductsContext';

const ProductList = () => {

  useEffect(() => {
    document.title = 'Product List';
    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  const {data} = useContext(allProductsContext)

  return (

    <div className="p-6 max-w-4xl mx-auto bg-white/40 mt-10 border rounded-xl shadow-xl">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">Product List</h1>
      <div className='flex justify-between items-center h-16'>
        <div className='text-gray-700 font-semibold min-w-[250px]'>Total Products in inventory : {data.length}</div>
        <div className='text-gray-700 font-semibold' ><ComboboxDemo frameworks={data} /></div>
      </div>
      <div className='text-gray-700 h-16 font-semibold flex justify-end items-center'>
        <Link to='/admin/addproduct' className={cn(buttonVariants({ variant: "outline" }), 'w-48')}>Add Product</Link>
      </div>
      <Table className="rounded-xl overflow-hidden shadow-md border border-gray-200">
        <TableCaption className="text-gray-500">A list of your products.</TableCaption>
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="w-64  text-gray-700">Product Name</TableHead>
            <TableHead className="w-36 text-gray-700">Barcode Number</TableHead>
            <TableHead className="max-w-36 text-right text-gray-700">Price (₹)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((d, index) => (
            <TableRow key={index} className="hover:bg-gray-50 transition-colors">
              <TableCell className="w-64 mfont-medium text-gray-900">{d.productName}</TableCell>
              <TableCell className="w-36 text-gray-700">{d.barcodeNumber}</TableCell>
              <TableCell className="w-36 text-right text-gray-800 font-semibold">{d.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>  
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold text-gray-800">Total Products</TableCell>
            <TableCell colSpan={2} className="text-right font-bold text-gray-900">{data.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

export default ProductList