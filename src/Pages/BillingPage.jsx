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
    <div>
      <Navbarr/>
    </div>
  )
}

export default BillingPage
