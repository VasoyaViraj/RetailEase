import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getPendingDues, settleDueCash } from '@/services/ledgerService';
import { databases, Query } from '@/services/appwriteConfig';
import { useAuth } from '@/providers/AuthProvider';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASEID;
const CUSTOMERS_COLLECTION = import.meta.env.VITE_APPWRITE_CUSTOMERS_COLLECTIONID;

export default function LedgerDashboard() {
  const { user } = useAuth();
  const [dues, setDues] = useState([]);
  const [customers, setCustomers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Settlement dialog state
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    document.title = 'Ledger Dashboard';
    return () => { document.title = 'RetailEase'; };
  }, []);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const pendingDues = await getPendingDues();
      setDues(pendingDues);

      // Fetch customer details for all unique customerIds
      const customerIds = [...new Set(pendingDues.map((d) => d.customerId))];
      const customerMap = {};

      for (const cId of customerIds) {
        if (cId && !customers[cId]) {
          try {
            const doc = await databases.getDocument(DB_ID, CUSTOMERS_COLLECTION, cId);
            customerMap[cId] = doc;
          } catch {
            customerMap[cId] = { name: 'Unknown', mobile: '-', email: '-' };
          }
        }
      }

      setCustomers((prev) => ({ ...prev, ...customerMap }));
    } catch (err) {
      console.error('Failed to fetch dues:', err);
      setError('Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, []);

  const handleSettle = (due) => {
    setSelectedDue(due);
    setSettlementAmount('');
    setSettleDialogOpen(true);
  };

  const submitSettlement = async () => {
    if (!selectedDue || !settlementAmount) return;

    const amount = parseFloat(settlementAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (amount > selectedDue.remainingAmount) {
      setError(`Amount cannot exceed remaining ₹${selectedDue.remainingAmount.toFixed(2)}`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSettling(true);
    try {
      await settleDueCash({
        ledgerDueId: selectedDue.$id,
        orderId: selectedDue.orderId,
        customerId: selectedDue.customerId,
        settlementAmount: amount,
        createdBy: user?.$id || 'staff',
      });

      setSettleDialogOpen(false);
      setSelectedDue(null);
      await fetchDues();
    } catch (err) {
      console.error('Settlement failed:', err);
      setError('Settlement failed. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSettling(false);
    }
  };

  const filteredDues = dues.filter((due) => {
    if (!searchTerm) return true;
    const customer = customers[due.customerId];
    const search = searchTerm.toLowerCase();
    return (
      customer?.name?.toLowerCase().includes(search) ||
      customer?.mobile?.includes(search) ||
      customer?.email?.toLowerCase().includes(search) ||
      due.orderId?.toLowerCase().includes(search)
    );
  });

  const totalRemaining = filteredDues.reduce((sum, d) => sum + d.remainingAmount, 0);

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

  return (
    <div className="w-full mx-auto p-4 pt-0 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">UDHAAR Ledger</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Manage pending dues and settlements</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Total Pending</p>
            <p className="text-4xl font-black text-[#FF3000]">₹{totalRemaining.toFixed(2)}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search by customer name, mobile, email or order ID..."
            className="pl-10 w-full p-3 swiss-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="swiss-card flex flex-col">
          <div className="border-b-2 border-black p-4">
            <h2 className="swiss-label text-base">Pending Dues ({filteredDues.length})</h2>
          </div>
          <div className="p-0 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500 font-bold tracking-widest uppercase text-sm">Loading ledger...</p>
              </div>
            ) : filteredDues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <p className="text-lg font-black uppercase tracking-wider">No pending dues</p>
                <p className="text-sm mt-1 uppercase tracking-widest font-bold">All dues have been settled</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-black text-white">
                  <TableRow className="hover:bg-black border-b-2 border-black">
                    <TableHead className="text-white font-bold uppercase tracking-widest text-xs">Customer</TableHead>
                    <TableHead className="text-white font-bold uppercase tracking-widest text-xs">Mobile</TableHead>
                    <TableHead className="text-white font-bold uppercase tracking-widest text-xs">Email</TableHead>
                    <TableHead className="text-white font-bold uppercase tracking-widest text-xs">Order ID</TableHead>
                    <TableHead className="text-right text-white font-bold uppercase tracking-widest text-xs">Due</TableHead>
                    <TableHead className="text-right text-white font-bold uppercase tracking-widest text-xs">Paid</TableHead>
                    <TableHead className="text-right text-white font-bold uppercase tracking-widest text-xs">Remaining</TableHead>
                    <TableHead className="text-white font-bold uppercase tracking-widest text-xs">Status</TableHead>
                    <TableHead className="text-white font-bold uppercase tracking-widest text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDues.map((due) => {
                    const customer = customers[due.customerId] || {};
                    return (
                      <TableRow key={due.$id} className="hover:bg-[#F2F2F2] border-b border-black">
                        <TableCell className="font-bold uppercase tracking-wide text-black">{customer.name || '-'}</TableCell>
                        <TableCell className="font-medium text-black">{customer.mobile || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-500 font-medium">{customer.email || '-'}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-gray-500">
                          {due.orderId?.slice(-8) || '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-black border-l border-gray-200">₹{due.dueAmount?.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold text-black">₹{due.paidAmount?.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-black text-[#FF3000]">
                          ₹{due.remainingAmount?.toFixed(2)}
                        </TableCell>
                        <TableCell>{statusBadge(due.status)}</TableCell>
                        <TableCell>
                          {due.status !== 'settled' && (
                            <button
                              className="px-4 py-2 bg-black text-white font-bold uppercase tracking-widest text-[10px] border-2 border-black hover:bg-[#FF3000] hover:border-[#FF3000] transition-colors"
                              onClick={() => handleSettle(due)}
                            >
                              Settle
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Settlement Dialog */}
      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent className="swiss-card p-0 sm:max-w-md">
          <DialogHeader className="p-4 border-b-2 border-black">
            <DialogTitle className="font-black uppercase tracking-widest text-[#FF3000]">Cash Settlement</DialogTitle>
          </DialogHeader>

          {selectedDue && (
            <div className="space-y-6 p-6">
              <div className="bg-[#F2F2F2] border-2 border-black p-4 space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-gray-500">Customer</span>
                  <span className="text-black">{customers[selectedDue.customerId]?.name || '-'}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-2">
                  <span className="text-gray-500">Order</span>
                  <span className="text-black">{selectedDue.orderId?.slice(-8)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest pt-2">
                  <span className="text-gray-500">Due Amount</span>
                  <span className="text-black">₹{selectedDue.dueAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-gray-500">Already Paid</span>
                  <span className="text-black">₹{selectedDue.paidAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black uppercase tracking-widest border-t-2 border-black pt-2 mt-2">
                  <span>Remaining</span>
                  <span className="text-[#FF3000]">₹{selectedDue.remainingAmount?.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="swiss-label block mb-2">
                  Settlement Amount (max ₹{selectedDue.remainingAmount?.toFixed(2)})
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  max={selectedDue.remainingAmount}
                  min={1}
                  step="0.01"
                  autoFocus
                  className="w-full p-3 swiss-input"
                />
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 px-4 py-3 bg-white text-black font-bold uppercase tracking-widest text-[10px] border-2 border-black hover:bg-black hover:text-white transition-colors"
                  onClick={() => setSettleDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-3 bg-black text-white font-bold uppercase tracking-widest text-[10px] border-2 border-black hover:bg-[#FF3000] hover:border-[#FF3000] transition-colors disabled:opacity-50"
                  onClick={submitSettlement}
                  disabled={settling || !settlementAmount}
                >
                  {settling ? 'PROCESSING...' : 'CONFIRM SETTLEMENT'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
