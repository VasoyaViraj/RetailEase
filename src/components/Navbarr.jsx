import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/providers/AuthProvider';

const Navbarr = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout, loading, hasRole } = useAuth();

  // ✅ get label from localStorage
  const label = localStorage.getItem("label");

  // ✅ wait for auth
  if (loading) return null;

  // ❌ hide navbar if:
  // - no user
  // - label is empty
  // - label is not cashier
  if (!user || !label || label !== "cashier") return null;

  // ✅ Role-based links
  const navLinks = [
    { to: '/', label: 'Billing', roles: ['cashier'] },
    { to: '/admin/addproduct', label: 'Add Product', roles: ['admin'] },
    { to: '/admin/productlist', label: 'Products', roles: ['admin'] },
    { to: '/admin/ledger', label: 'Ledger', roles: ['admin'] },
    { to: '/dashboard', label: 'Dashboard', roles: ['cashier', 'admin'] },
  ];

  // ✅ filter links
  const filteredLinks = navLinks.filter(link =>
    hasRole(...link.roles)
  );

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return(
        <>  
          <div className='navDiv h-[80px] flex justify-center items-center w-full px-4'>
            <header className="flex-1 flex h-14 shrink-0 items-center px-6 md:px-8 bg-white border-b-4 border-black">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden rounded-none border-2 border-black">
                        <MenuIcon className="h-6 w-6" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="rounded-none border-r-4 border-black">
                <div className="grid gap-1 py-6">
                    {navLinks.map(({ to, label }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`ml-8 flex items-center py-2 px-4 text-sm font-bold uppercase tracking-wider transition-colors duration-150 ${
                                isActive(to)
                                    ? 'bg-black text-white'
                                    : 'text-black hover:bg-[#F2F2F2]'
                            }`}
                        >   
                          {label}
                        </Link>
                    ))}
                </div>
                </SheetContent>
            </Sheet>

            <Link to='/'>
                <span className='ml-3 font-black text-lg uppercase tracking-tighter'>
                    RetailEase
                </span>
            </Link>

            <nav className="ml-auto hidden lg:flex gap-0">
                {navLinks.map(({ to, label }) => (
                    <Link
                        key={to}
                        to={to}
                        className={`inline-flex h-14 items-center justify-center px-5 text-xs font-bold uppercase tracking-widest transition-all duration-150 border-b-4 ${
                            isActive(to)
                                ? 'border-[#FF3000] text-black'
                                : 'border-transparent text-gray-600 hover:text-black hover:border-black'
                        }`}
                    >
                        {label}
                    </Link>
                ))}
            </nav>

            {user && (
                <button
                    onClick={logout}
                    className="ml-4 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#FF3000] transition-colors duration-150"
                >
                    Logout
                </button>
            )}
            </header>
          </div>
        </>
    )
}

function MenuIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="18" y2="18" />
      </svg>
    )
}

export default Navbarr