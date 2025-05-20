import React, { createContext, useEffect, useState } from 'react';
import { databases } from '@/services/appwriteConfig';

export const allProductsContext = createContext();

export const AllProductsProvider = ({ children }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchAllProducts() {
      try {
        const response = await databases.listDocuments(
          '6810918b0009c28b3b9d',
          '6810919e003221b85c31'
        );
        setData(response.documents);
        console.log('Fetched products:', response.documents);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
      }
    }

    fetchAllProducts();
  }, []);

  return (
    <allProductsContext.Provider value={{ data, setData }}>
      {children}
    </allProductsContext.Provider>
  );
};
