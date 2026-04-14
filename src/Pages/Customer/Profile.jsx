import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getCustomerByUserId } from '@/services/customerService';
import { getDuesByCustomer, settleViaRazorpay } from '@/services/ledgerService';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { CreditCard, CheckCircle, AlertCircle, Loader2, LogOut, User, Phone, Mail, IndianRupee, Zap } from 'lucide-react';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';

/** Dynamically load Razorpay checkout script */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingDueId, setPayingDueId] = useState(null); // ID of due being paid, or 'all'
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    document.title = 'My Profile — RetailEase';
    return () => { document.title = 'RetailEase'; };
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError('');
    try {
      const cust = await getCustomerByUserId(user.$id);
      setCustomer(cust);
      if (cust) {
        const allDues = await getDuesByCustomer(cust.$id);
        setDues(allDues);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const pendingDues = dues.filter((d) => d.status !== 'settled');
  const totalRemaining = pendingDues.reduce((sum, d) => sum + d.remainingAmount, 0);

  /** Open Razorpay modal for a specific amount and set of dues */
  const openRazorpay = async ({ amount, description, duestoSettle }) => {
    setError('');
    setSuccessMsg('');

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError('Failed to load Razorpay. Please check your internet connection.');
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100), // Razorpay expects paise (INR × 100)
      currency: 'INR',
      name: 'RetailEase',
      description: description,
      image: 'https://i.imgur.com/3g7nmJC.png',
      prefill: {
        name: customer?.name || '',
        email: customer?.email || user?.email || '',
        contact: customer?.mobile || '',
      },
      theme: { color: '#FF3000' },
      modal: {
        ondismiss: () => {
          setPayingDueId(null);
        },
      },
      handler: async (response) => {
        // Payment successful — settle each due in Appwrite
        try {
          for (const due of duestoSettle) {
            await settleViaRazorpay({
              ledgerDueId: due.$id,
              orderId: due.orderId || '',
              customerId: customer.$id,
              settlementAmount: due.remainingAmount,
              razorpayPaymentId: response.razorpay_payment_id,
              createdBy: user?.$id || 'customer',
            });
          }
          setSuccessMsg(
            `✅ Payment of ₹${amount.toFixed(2)} received! ID: ${response.razorpay_payment_id}`
          );
          await loadProfile(); // Refresh dues
        } catch (err) {
          console.error('Settlement error:', err);
          setError('Payment received but failed to update records. Please contact support with ID: ' + response.razorpay_payment_id);
        } finally {
          setPayingDueId(null);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (resp) => {
      setError('Payment failed: ' + (resp.error?.description || 'Unknown error'));
      setPayingDueId(null);
    });
    rzp.open();
  };

  const handlePayDue = async (due) => {
    setPayingDueId(due.$id);
    await openRazorpay({
      amount: due.remainingAmount,
      description: `Due settlement for order #${due.orderId?.slice(-8) || 'N/A'}`,
      duestoSettle: [due],
    });
  };

  const handlePayAll = async () => {
    setPayingDueId('all');
    await openRazorpay({
      amount: totalRemaining,
      description: `Settle all ${pendingDues.length} pending dues`,
      duestoSettle: pendingDues,
    });
  };

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-400',
      partiallySettled: 'bg-blue-100 text-blue-800 border-blue-400',
      settled: 'bg-green-100 text-green-800 border-green-400',
    };
    return (
      <Badge variant="outline" className={`${styles[status] || ''} font-bold uppercase text-[10px] tracking-widest`}>
        {status === 'partiallySettled' ? 'Partial' : status}
      </Badge>
    );
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 swiss-dots bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#FF3000]" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Loading profile...</p>
      </div>
    );
  }

  /* ─── No customer linked ─── */
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 swiss-dots bg-white px-6">
        <div className="swiss-card p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-[#FF3000] mx-auto mb-4" />
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">No Profile Found</h1>
          <p className="text-gray-500 font-medium text-sm">
            Your account is not linked to a customer record yet. Please make a purchase in-store first.
          </p>
          <button
            className="mt-6 px-6 py-3 bg-black text-white font-bold uppercase tracking-widest text-xs border-2 border-black hover:bg-[#FF3000] hover:border-[#FF3000] transition-colors w-full"
            onClick={logout}
          >
            <LogOut className="inline w-4 h-4 mr-2" />Log Out
          </button>
        </div>
      </div>
    );
  }

  /* ─── Main Profile ─── */
  return (
    <div className="w-full min-h-screen swiss-dots bg-white pb-12">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-black">My Account</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">
              Manage your dues &amp; pay online
            </p>
          </div>
          <button
            className="px-5 py-2.5 bg-white text-black font-bold uppercase tracking-widest text-xs border-2 border-black hover:bg-black hover:text-white transition-colors flex items-center gap-2"
            onClick={logout}
          >
            <LogOut className="w-3.5 h-3.5" />Log Out
          </button>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 text-sm font-bold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border-2 border-green-500 text-green-700 px-4 py-3 text-sm font-bold flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Profile Details ── */}
        <div className="swiss-card">
          <div className="p-4 border-b-2 border-black bg-black">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Profile Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#F2F2F2] border-2 border-black flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Name</p>
                <p className="font-black text-black mt-1 uppercase">{customer.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#F2F2F2] border-2 border-black flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Mobile</p>
                <p className="font-black text-black mt-1">{customer.mobile}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#F2F2F2] border-2 border-black flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</p>
                <p className="font-black text-black mt-1 break-all">{customer.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Outstanding Summary ── */}
        <div className="swiss-card overflow-hidden">
          <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Total Outstanding</p>
              <div className="flex items-end gap-1 mt-1">
                <IndianRupee className="w-7 h-7 text-[#FF3000] font-black" />
                <span className="text-5xl font-black text-[#FF3000] leading-none">{totalRemaining.toFixed(2)}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-2">
                {pendingDues.length} pending {pendingDues.length === 1 ? 'due' : 'dues'}
              </p>
            </div>
            {totalRemaining > 0 && (
              <button
                id="pay-all-btn"
                className="px-8 py-4 bg-[#FF3000] text-white font-black uppercase tracking-widest text-sm border-2 border-[#FF3000] hover:bg-black hover:border-black transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handlePayAll}
                disabled={payingDueId !== null}
              >
                {payingDueId === 'all' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Pay All ₹{totalRemaining.toFixed(2)}
              </button>
            )}
            {totalRemaining === 0 && dues.length > 0 && (
              <div className="flex items-center gap-2 text-green-700 font-black uppercase tracking-widest text-sm">
                <CheckCircle className="w-5 h-5" />
                All dues settled!
              </div>
            )}
          </div>

          {/* Razorpay test mode banner */}
          <div className="border-t-2 border-black bg-yellow-50 px-6 py-2 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-yellow-700 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-700">
              Test Mode — Use card: <span className="font-black">4111 1111 1111 1111</span> · Exp: any future date · CVV: any 3 digits
            </p>
          </div>
        </div>

        {/* ── Dues Table ── */}
        <div className="swiss-card overflow-hidden">
          <div className="p-4 border-b-2 border-black bg-black">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">My Dues History</h2>
          </div>
          <div className="overflow-auto">
            {dues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <CheckCircle className="w-10 h-10" />
                <p className="font-black uppercase tracking-widest text-sm">No dues found</p>
                <p className="text-xs font-bold uppercase tracking-widest">You have no outstanding balances</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-black hover:bg-black bg-[#1a1a1a]">
                    <TableHead className="text-white font-black uppercase tracking-widest text-[10px]">Order</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-[10px]">Date</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-[10px] text-right">Total Due</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-[10px] text-right">Paid</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-[10px] text-right">Remaining</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="text-white font-black uppercase tracking-widest text-[10px]">Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dues.map((due) => (
                    <TableRow key={due.$id} className="border-b border-gray-200 hover:bg-[#F2F2F2] transition-colors">
                      <TableCell className="font-bold text-black uppercase text-xs">
                        #{due.orderId?.slice(-8) || 'N/A'}
                      </TableCell>
                      <TableCell className="text-black font-medium text-xs">
                        {due.$createdAt
                          ? format(new Date(due.$createdAt), 'dd MMM yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right text-black font-bold text-xs">
                        ₹{due.dueAmount?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-700 font-bold text-xs">
                        ₹{due.paidAmount?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-black text-sm">
                        {due.remainingAmount > 0 ? (
                          <span className="text-[#FF3000]">₹{due.remainingAmount?.toFixed(2)}</span>
                        ) : (
                          <span className="text-green-600">₹0.00</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(due.status)}</TableCell>
                      <TableCell>
                        {due.status !== 'settled' ? (
                          <button
                            id={`pay-due-${due.$id}`}
                            className="px-3 py-1.5 bg-black text-white font-bold uppercase tracking-widest text-[9px] border-2 border-black hover:bg-[#FF3000] hover:border-[#FF3000] transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handlePayDue(due)}
                            disabled={payingDueId !== null}
                          >
                            {payingDueId === due.$id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CreditCard className="w-3 h-3" />
                            )}
                            Pay ₹{due.remainingAmount?.toFixed(2)}
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle className="w-3 h-3" />Paid
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Payments are secured by Razorpay · Test mode active
        </p>
      </div>
    </div>
  );
}