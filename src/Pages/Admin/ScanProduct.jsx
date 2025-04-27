import React from 'react'

const ScanProduct = () => {

  React.useEffect(() => {
    document.title = 'Scan Product';

    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  return (
    <div>
      ScanProduct
    </div>
  )
}

export default ScanProduct
