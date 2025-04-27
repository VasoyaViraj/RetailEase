import React from 'react'

const ProductList = () => {

  React.useEffect(() => {
    document.title = 'Product List';

    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  return (
    <div>
      ProductList
    </div>
  )
}

export default ProductList
