import React from 'react'
import Navbarr from '../components/Navbarr';

const BillingPage = () => {

  React.useEffect(() => {
    document.title = 'Billing Page';

    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  return (
    <div className='h-screen-48 tbor flexbox'>
      <div className='min-h-136 tbor min-w-84 flexbox'>
        Hy
      </div>
    </div>
  )
}

export default BillingPage
