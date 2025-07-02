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
import { databases } from '@/services/appwriteConfig';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ProductList = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productToEdit, setProductToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    productName: '',
    barcodeNumber: '',
    price: '',
    stock: 0.0
  });
  const {data, setData} = useContext(allProductsContext);

  useEffect(() => {
    document.title = 'Product List';
    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (product) => {
    console.log('Edit clicked for product:', product);
    setProductToEdit(product);
    setEditFormData({
      productName: product.productName || '',
      barcodeNumber: product.barcodeNumber || '',
      price: product.price || '',
      stock: product.stock || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditConfirm = async () => {
    try {
      if (!productToEdit || !productToEdit.$id) {
        alert('No product selected for editing');
        return;
      }

      // Validate required fields
      if (!editFormData.productName.trim()) {
        alert('Product name is required');
        return;
      }
      if (!editFormData.barcodeNumber) {
        alert('Barcode number is required');
        return;
      }
      if (!editFormData.price || editFormData.price <= 0) {
        alert('Please enter a valid price');
        return;
      }
      if (editFormData.stock < 0) {
        alert('Stock cannot be negative');
        return;
      }

      // Prepare the data for update
      const updateData = {
        productName: editFormData.productName.trim(),
        barcodeNumber: parseInt(editFormData.barcodeNumber),
        price: parseFloat(editFormData.price),
        stock: parseFloat(editFormData.stock) || 0.0
      };

      // Update in database
      const updatedProduct = await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASEID,
        import.meta.VITE_APPWRITE_PRODUCTS_COLLECTIONID,
        productToEdit.$id,
        updateData
      );

      if (updatedProduct) {
        // Update local state immediately
        setData(prevData => prevData.map(item => 
          item.$id === productToEdit.$id ? updatedProduct : item
        ));

        // Close dialog and reset form
        setEditDialogOpen(false);
        setProductToEdit(null);
        setEditFormData({
          productName: '',
          barcodeNumber: '',
          price: '',
          stock: 0.0
        });

        // Show success message
        alert('Product updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      if (error.message) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Failed to update product. Please check your input and try again.');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASEID,
        import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTIONID,
        productToDelete.$id
      );
      
      setData(data.filter(item => item.$id !== productToDelete.$id));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

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
            <TableHead className="w-64 text-gray-700">Product Name</TableHead>
            <TableHead className="w-36 text-gray-700">Barcode Number</TableHead>
            <TableHead className="max-w-36 text-right text-gray-700">Price (₹)</TableHead>
            <TableHead className="max-w-36 text-right text-gray-700">Buying Price (₹)</TableHead>
            <TableHead className="w-24 text-center text-gray-700">Stocks</TableHead>
            <TableHead className="w-32 text-center text-gray-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((d, index) => (
            <TableRow key={index} className="hover:bg-gray-50 transition-colors">
              <TableCell className="w-64 font-medium text-gray-900">{d.productName}</TableCell>
              <TableCell className="w-36 text-gray-700">{d.barcodeNumber}</TableCell>
              <TableCell className="w-36 text-right text-gray-800 font-semibold">{d.price}</TableCell>
              <TableCell className="w-36 text-right text-gray-800 font-semibold">{d.buyingPrice}</TableCell>
              <TableCell className="w-24 text-center">
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  d.stock > 10 
                    ? 'bg-green-100 text-green-700' 
                    : d.stock > 0 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-red-100 text-red-700'
                }`}>
                  {d.stock || 0}
                </span>
              </TableCell>
              <TableCell className="w-32 text-center">
                <div className="flex justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 ease-in-out transform hover:scale-110"
                    onClick={() => handleEditClick(d)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 ease-in-out transform hover:scale-110"
                    onClick={() => handleDeleteClick(d)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>  
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold text-gray-800">Total Products</TableCell>
            <TableCell colSpan={2} className="text-right font-bold text-gray-900">{data.length}</TableCell>
            <TableCell className="text-center font-semibold text-gray-800">
              Total Stock
            </TableCell>
            <TableCell className="text-center font-bold text-gray-900">
              {data.reduce((sum, item) => sum + (item.stock || 0), 0)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              "{productToDelete?.productName}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">Edit Product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-product-name" className="text-sm font-medium text-gray-700">Product Name</Label>
              <Input
                id="edit-product-name"
                value={editFormData.productName}
                onChange={(e) => setEditFormData({...editFormData, productName: e.target.value})}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-barcode" className="text-sm font-medium text-gray-700">Barcode Number</Label>
              <Input
                id="edit-barcode"
                type="number"
                value={editFormData.barcodeNumber}
                onChange={(e) => setEditFormData({...editFormData, barcodeNumber: e.target.value})}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price" className="text-sm font-medium text-gray-700">Price</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={editFormData.price}
                onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-stock" className="text-sm font-medium text-gray-700">Stock</Label>
              <Input
                id="edit-stock"
                type="number"
                step="0.01"
                min="0"
                value={editFormData.stock}
                onChange={(e) => setEditFormData({...editFormData, stock: e.target.value})}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditDialogOpen(false);
                setProductToEdit(null);
                setEditFormData({
                  productName: '',
                  barcodeNumber: '',
                  price: '',
                  stock: 0.0
                });
              }}
              className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditConfirm}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductList