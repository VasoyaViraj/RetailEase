import React, { createContext, useEffect, useState } from 'react';
// import { databases } from '@/services/appwriteConfig';

export const allProductsContext = createContext();

export const AllProductsProvider = ({ children }) => {
  const [data, setData] = useState(prd);

  // useEffect(() => {
  //   async function fetchAllProducts() {
  //     try {
  //       const response = await databases.listDocuments(
  //         '6810918b0009c28b3b9d',
  //         '6810919e003221b85c31'
  //       );
  //       setData(response.documents);
  //       console.log('Fetched products:', response.documents);
  //     } catch (error) {
  //       console.error('Failed to fetch products:', error);
  //     } finally {
  //     }
  //   }

  //   fetchAllProducts();
  // }, []);

  return (
    <allProductsContext.Provider value={{ data, setData }}>
      {children}
    </allProductsContext.Provider>
  );
};

var prd = [
  {
      "productName": "Balaji Wafers",
      "isBarcode": 1,
      "barcodeNumber": 1234561,
      "price": 45,
      "stock": 8,
      "buyingPrice": 35,
      "$id": "6811014200251316dc3d",
      "$sequence": "1",
      "$createdAt": "2025-04-29T16:41:38.403+00:00",
      "$updatedAt": "2025-06-21T06:42:24.330+00:00",
      "$permissions": [],
      "$databaseId": "6810918b0009c28b3b9d",
      "$collectionId": "6810919e003221b85c31"
  },
  {
      "productName": "Facewash",
      "isBarcode": 1,
      "barcodeNumber": 1234562,
      "price": 150,
      "stock": 7,
      "buyingPrice": 120,
      "$id": "6811015f000cfa03abdc",
      "$sequence": "2",
      "$createdAt": "2025-04-29T16:42:06.989+00:00",
      "$updatedAt": "2025-06-21T06:42:24.903+00:00",
      "$permissions": [],
      "$databaseId": "6810918b0009c28b3b9d",
      "$collectionId": "6810919e003221b85c31"
  },
  {
      "productName": "T-shirt",
      "isBarcode": 1,
      "barcodeNumber": 1234564,
      "price": 555,
      "stock": 8,
      "buyingPrice": 450,
      "$id": "6811019300263fbd8f8d",
      "$sequence": "4",
      "$createdAt": "2025-04-29T16:42:59.387+00:00",
      "$updatedAt": "2025-06-21T06:42:25.429+00:00",
      "$permissions": [],
      "$databaseId": "6810918b0009c28b3b9d",
      "$collectionId": "6810919e003221b85c31"
  },
  {
      "productName": "Malata Orange",
      "isBarcode": 1,
      "barcodeNumber": 1234566,
      "price": 50,
      "stock": 10,
      "buyingPrice": 40,
      "$id": "681101bc0035d1277b29",
      "$sequence": "6",
      "$createdAt": "2025-04-29T16:43:40.633+00:00",
      "$updatedAt": "2025-06-20T16:01:46.713+00:00",
      "$permissions": [],
      "$databaseId": "6810918b0009c28b3b9d",
      "$collectionId": "6810919e003221b85c31"
  },
  {
      "productName": "Watermelon",
      "isBarcode": 1,
      "barcodeNumber": 1234567,
      "price": 80,
      "stock": 10,
      "buyingPrice": 70,
      "$id": "681101d7003233fb841f",
      "$sequence": "7",
      "$createdAt": "2025-04-29T16:44:07.579+00:00",
      "$updatedAt": "2025-06-20T16:01:19.051+00:00",
      "$permissions": [],
      "$databaseId": "6810918b0009c28b3b9d",
      "$collectionId": "6810919e003221b85c31"
  },
  {
      "productName": "Keyboard and Mouse Combo",
      "isBarcode": 0,
      "barcodeNumber": 12345645,
      "price": 800,
      "stock": 10,
      "buyingPrice": 650,
      "$id": "68451500bb2d18bebee1",
      "$sequence": "40",
      "$createdAt": "2025-06-08T04:43:44.767+00:00",
      "$updatedAt": "2025-06-20T16:00:59.604+00:00",
      "$permissions": [],
      "$databaseId": "6810918b0009c28b3b9d",
      "$collectionId": "6810919e003221b85c31"
  },
  {
      "productName": "pen",
      "isBarcode": 0,
      "barcodeNumber": 123123123,
      "price": 20,
      "stock": 48,
      "buyingPrice": 12,
      "$id": "684e7303b4978210b0f6",
      "$sequence": "41",
      "$createdAt": "2025-06-15T07:15:15.740+00:00",
      "$updatedAt": "2025-06-20T15:57:38.674+00:00",
      "$permissions": [],
      "$databaseId": "6810918b0009c28b3b9d",
      "$collectionId": "6810919e003221b85c31"
  },
  {
      "productName": "maggi",
      "isBarcode": 0,
      "barcodeNumber": 12345687,
      "price": 13,
      "stock": 9,
      "buyingPrice": 10,
      "$id": "6850e6d30c9cb81cf190",
      "$sequence": "42",
      "$createdAt": "2025-06-17T03:53:55.052+00:00",
      "$updatedAt": "2025-06-21T08:58:13.129+00:00",
      "$permissions": [],
      "$databaseId": "6810918b0009c28b3b9d",
      "$collectionId": "6810919e003221b85c31"
  },
  {
      "productName": "Book",
      "isBarcode": 0,
      "barcodeNumber": 123113211112,
      "price": 60,
      "stock": 10,
      "buyingPrice": 50,
      "$id": "68524df91f727a24fdc7",
      "$sequence": "43",
      "$createdAt": "2025-06-18T05:26:17.129+00:00",
      "$updatedAt": "2025-06-20T15:56:47.495+00:00",
      "$permissions": [],
      "$databaseId": "6810918b0009c28b3b9d",
      "$collectionId": "6810919e003221b85c31"
  },
  {
      "productName": "potato",
      "isBarcode": 0,
      "barcodeNumber": 101010,
      "price": 25.5,
      "stock": 18,
      "buyingPrice": 20.5,
      "$id": "6856703380d87b41ac17",
      "$sequence": "44",
      "$createdAt": "2025-06-21T08:41:23.528+00:00",
      "$updatedAt": "2025-06-21T08:55:24.638+00:00",
      "$permissions": [],
      "$databaseId": "6810918b0009c28b3b9d",
      "$collectionId": "6810919e003221b85c31"
  },
  {
      "productName": "Mung Dal",
      "isBarcode": 0,
      "barcodeNumber": 121212,
      "price": 40,
      "stock": 10.5,
      "buyingPrice": 35.5,
      "$id": "6856709b330e337d6fb5",
      "$sequence": "45",
      "$createdAt": "2025-06-21T08:43:07.209+00:00",
      "$updatedAt": "2025-06-21T08:58:13.702+00:00",
      "$permissions": [],
      "$databaseId": "6810918b0009c28b3b9d",
      "$collectionId": "6810919e003221b85c31"
  }
]