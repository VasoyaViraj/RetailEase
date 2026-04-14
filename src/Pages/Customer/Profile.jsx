import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getCustomerByUserId } from '@/services/customerService';
import { getDuesByCustomer } from '@/services/ledgerService';
import { functions } from '@/services/appwriteConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default function Profile() {
  const { user, logout } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'My Profile';
    return () => { document.title = 'RetailEase'; };
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.$id) return;
      setLoading(true);
      try {
        const cust = await getCustomerByUserId(user.$id);
        setCustomer(cust);

        if (cust) {
          const allDues = await getDuesByCustomer(cust.$id);
          setDues(allDues);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const pendingDues = dues.filter((d) => d.status !== 'settled');
  const totalRemaining = pendingDues.reduce((sum, d) => sum + d.remainingAmount, 0);

  const handlePayOnline = async (due) => {
    try {
      const execution = await functions.createExecution(
        '69de80d1002b4cdc734a', // Function ID for Stripe Integration
        JSON.stringify({
          customerId: customer.$id,
          ledgerDueId: due.$id,
          amount: due.remainingAmount
        }),
        false,
        '/createCheckoutSession',
        'POST'
      );
      
      const response = JSON.parse(execution.responseBody);
      if (response.ok && response.url) {
        window.location.href = response.url;
      } else {
        alert('Payment failed to initialize: ' + (response.message || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to payment gateway.');
    }
  };

  const handlePayAll = async () => {
    try {
      const execution = await functions.createExecution(
        '69de80d1002b4cdc734a',
        JSON.stringify({
          customerId: customer.$id,
          ledgerDueId: '',
          amount: totalRemaining
        }),
        false,
        '/createCheckoutSession',
        'POST'
      );
      
      const response = JSON.parse(execution.responseBody);
      if (response.ok && response.url) {
        window.location.href = response.url;
      } else {
        alert('Payment failed to initialize: ' + (response.message || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to payment gateway.');
    }
  };

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      partiallySettled: 'bg-blue-100 text-blue-800 border-blue-300',
      settled: 'bg-green-100 text-green-800 border-green-300',
    };
    return (
      <Badge variant="outline" className={`${styles[status] || ''} font-medium uppercase text-xs tracking-wide`}>
        {status === 'partiallySettled' ? 'Partial' : status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">No Profile Found</h1>
        <p className="text-gray-500">
          Your account is not linked to a customer record yet. Please make a purchase in-store first.
        </p>
        <Button variant="outline" onClick={logout}>Log Out</Button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6 min-h-screen swiss-dots bg-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-black">My Account</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Manage your dues and payments</p>
          </div>
          <button 
            className="px-6 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs border-2 border-black hover:bg-black hover:text-white transition-colors"
            onClick={logout}
          >
            Log Out
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Customer Info */}
        <div className="swiss-card bg-white">
          <div className="p-4 border-b-2 border-black">
            <h2 className="text-xl font-black uppercase tracking-tighter text-black">Profile Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Name</p>
                <p className="font-bold text-black mt-1 uppercase">{customer.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Mobile</p>
                <p className="font-bold text-black mt-1">{customer.mobile}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Email</p>
                <p className="font-bold text-black mt-1">{customer.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Due Summary */}
        <div className="swiss-card bg-[#F2F2F2]">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-widest font-black">Total Outstanding</p>
                <p className="text-5xl font-black text-[#FF3000] mt-2">₹{totalRemaining.toFixed(2)}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-2">{pendingDues.length} pending {pendingDues.length === 1 ? 'due' : 'dues'}</p>
              </div>
              {totalRemaining > 0 && (
                <button
                  className="px-8 py-4 bg-[#FF3000] text-white font-black uppercase tracking-widest text-sm border-2 border-[#FF3000] hover:bg-black hover:border-black transition-colors"
                  onClick={handlePayAll}
                >
                  Pay All Online
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dues List */}
        <div className="swiss-card overflow-hidden bg-white">
          <div className="p-4 border-b-2 border-black">
            <h2 className="text-xl font-black uppercase tracking-tighter text-black">My Dues</h2>
          </div>
          <div className="p-0 overflow-auto">
            {dues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <p className="text-lg font-black uppercase tracking-widest">No dues found</p>
                <p className="text-xs mt-2 font-bold uppercase tracking-widest">You have no outstanding balances</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-black text-white">
                  <TableRow className="border-b-2 border-black hover:bg-black">
                    <TableHead className="text-white font-black uppercase tracking-widest text-xs">Order</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-xs">Date</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-xs text-right">Due</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-xs text-right">Paid</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-xs text-right">Remaining</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-xs">Status</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dues.map((due) => (
                    <TableRow key={due.$id} className="cursor-pointer hover:bg-[#F2F2F2] border-b border-black">
                      <TableCell className="font-bold text-black uppercase">
                        {due.orderId?.slice(-8)}
                      </TableCell>
                      <TableCell className="text-black font-medium">
                        {due.createdAt ? format(new Date(due.createdAt), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right text-black font-bold">₹{due.dueAmount?.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-black font-bold border-l border-gray-200">₹{due.paidAmount?.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-black">
                        {due.remainingAmount > 0 ? (
                          <span className="text-[#FF3000]">₹{due.remainingAmount?.toFixed(2)}</span>
                        ) : (
                          <span className="text-black">₹0.00</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(due.status)}</TableCell>
                      <TableCell>
                        {due.status !== 'settled' && (
                          <button
                            className="px-4 py-2 bg-black text-white font-bold uppercase tracking-widest text-[10px] border-2 border-black hover:bg-[#FF3000] hover:border-[#FF3000] transition-colors"
                            onClick={() => handlePayOnline(due)}
                          >
                            Pay Online
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
