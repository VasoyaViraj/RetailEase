import React from 'react'

const AddProduct = () => {

  React.useEffect(() => {
    document.title = 'Add Product';

    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  return (
    <div>
      AddProduct
    </div>
  )
}

export default AddProduct
