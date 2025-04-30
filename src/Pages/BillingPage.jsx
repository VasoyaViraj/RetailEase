import React, { useRef, useState } from 'react';
import Navbarr from '../components/Navbarr';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReactToPrint } from 'react-to-print';

const BillingPage = () => {
  const componentRef = useRef();
  const [mobileNumber, setMobileNumber] = useState("");

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'RetailEase_Bill',
  });

  React.useEffect(() => {
    document.title = 'Billing Page';
    return () => {
      document.title = 'RetailEase';
    };
  }, []);

  const handleSendWhatsApp = () => {
    const phone = "91" + mobileNumber.replace(/\D/g, ""); // Sanitize number
    const message = encodeURIComponent("Hello! Here is your bill:\n\nTotal: ₹0.00\n\nThank you for shopping!");
    if (mobileNumber.length >= 10) {
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    } else {
      alert("Please enter a valid mobile number.");
    }
  };

  return (
    <div className="min-h-screen text-white p-6 flex flex-col lg:flex-row gap-6">
      {/* Left Section - Bill Form */}
      <div className="flex-1 space-y-4">
        <h1 className="text-2xl font-bold text-black">Store Name</h1>
        <div className="flex gap-2">
          <Input placeholder="Search to add item" className="flex-1 border border-black focus:outline-black" />
          <Button>Add</Button>
        </div>

        <Card ref={componentRef}>
          <CardHeader className="text-xl font-semibold">Bill Table</CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Replace with mapped items */}
                <TableRow>
                  <TableCell colSpan={2} className="font-bold">Total</TableCell>
                  <TableCell className="font-bold">0.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Right Section - Actions */}
      <div className="space-y-4 w-full lg:w-1/3">
        <Input
          className="border border-black focus:outline-black text-black"
          placeholder="Customer Mobile Number"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
        />
        <Button className="w-full">Save Entry to Database</Button>
        <Button className="w-full text-black" variant="outline" onClick={handlePrint}>Print Bill in PDF</Button>
        <Button className="w-full text-black" variant="outline" onClick={handleSendWhatsApp}>
          Send Bill to Customer (WhatsApp)
        </Button>
      </div>
    </div>
  );
};

export default BillingPage;
