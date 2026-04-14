import * as React from "react"
import {
  CalendarDays,
  IndianRupeeIcon,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  format,
  subDays,
  startOfMonth,
  startOfWeek,
  isToday,
  isYesterday,
  isWithinInterval,
  parseISO,
  endOfWeek,
  addWeeks,
  addDays,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { databases } from "@/services/appwriteConfig"
import { Query } from "@/services/appwriteConfig"

const chartConfig = {
  profit: {
    label: "Profit (₹)",
    color: "#10b981", // Modern emerald color
  },
}

export default function Dashboard() {
  const [selectedOrder, setSelectedOrder] = React.useState(null)
  const [activeTab, setActiveTab] = React.useState("all")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [dateRange, setDateRange] = React.useState({
    from: undefined,
    to: undefined,
  })
  const [currentWeekOffset, setCurrentWeekOffset] = React.useState(0)
  const [selectedDate, setSelectedDate] = React.useState(undefined)
  const [mockOrders, setMockOrders] = React.useState([])

  const today = new Date()
  const yesterday = subDays(today, 1)
  const startOfThisWeek = startOfWeek(today)
  const startOfThisMonth = startOfMonth(today)

  const todayOrders = mockOrders?.filter((order) => isToday((order.date)))
  const yesterdayOrders = mockOrders?.filter((order) => isYesterday((order.date)))
  const thisWeekOrders = mockOrders?.filter((order) => (order.date) >= startOfThisWeek)
  const thisMonthOrders = mockOrders?.filter((order) => (order.date) >= startOfThisMonth)

  const todayProfit = todayOrders.reduce((sum, order) => sum + order.profit, 0)
  const yesterdayProfit = yesterdayOrders.reduce((sum, order) => sum + order.profit, 0)
  const thisWeekProfit = thisWeekOrders.reduce((sum, order) => sum + order.profit, 0)
  const thisMonthProfit = thisMonthOrders.reduce((sum, order) => sum + order.profit, 0)

  const profitChange = yesterdayProfit > 0 ? ((todayProfit - yesterdayProfit) / yesterdayProfit) * 100 : 0

  const currentWeek = addWeeks(today, currentWeekOffset)
  const weekStart = startOfWeek(currentWeek)
  const weekEnd = endOfWeek(currentWeek)

  const getProfit = (date) => {
    return mockOrders?.reduce((sum, order) => {
      if(date == format(order.date, "yyyy-MM-dd")){
        return sum+order.profit
      }
      return sum;
    },0)
  }

  const generateChartData = (weekOffset) => {
    const baseWeek = addWeeks(today, weekOffset)
    const start = startOfWeek(baseWeek)

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i)
      const dateStr = format(date, "yyyy-MM-dd")

      return {
        date: dateStr,
        profit: getProfit(dateStr),
        fullDate: format(date, "EEEE, MMMM d, yyyy"),
      }
    })
  }

  const chartData = generateChartData(currentWeekOffset)

  const filteredOrders = React.useMemo(() => {
    let filtered = mockOrders

    // Filter by tab
    if (activeTab === "today") {
      filtered = filtered.filter((order) => isToday((order.date)))
    } else if (activeTab === "yesterday") {
      filtered = filtered.filter((order) => isYesterday((order.date)))
    } else if (activeTab === "custom" && dateRange.from && dateRange.to) {
      filtered = filtered.filter((order) =>
        isWithinInterval((order.date), { start: dateRange.from, end: dateRange.to }),
      )
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.cusName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.$id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [activeTab, searchTerm, dateRange,mockOrders])

  React.useEffect(()=>{
    const fetchAllDocuments = async () => {
      const allDocs = [];
      const dbId = import.meta.env.VITE_APPWRITE_DATABASEID;
      const collectionId = import.meta.env.VITE_APPWRITE_ORDERS_COLLECTIONID;
      let offset = 0;
      const limit = 100;
    
      while (true) {
        const res = await databases.listDocuments(dbId, collectionId, [
          Query.limit(limit),
          Query.offset(offset)
        ]);
    
        allDocs.push(...res.documents);
        if (res.documents.length < limit) break;
        offset += limit;
      }
    
      setMockOrders(allDocs);
    };
     fetchAllDocuments()
  },[])

  return (
    <div className="min-h-screen bg-white swiss-dots p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-black">RetailEase Dashboard</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Monitor your POS system performance</p>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-black border-2 border-black px-4 py-2 bg-white">
            {format(today, "EEEE, MMMM d, yyyy")}
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="swiss-card p-4 flex flex-col justify-between">
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-black">Today's Orders</h3>
              <ShoppingCart className="h-5 w-5 text-[#FF3000]" />
            </div>
            <div>
              <div className="text-4xl font-black text-black">{todayOrders.length}</div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                {todayOrders.length > yesterdayOrders.length ? "+" : ""}
                {todayOrders.length - yesterdayOrders.length} from yesterday
              </p>
            </div>
          </div>

          <div className="swiss-card p-4 flex flex-col justify-between">
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-black">Today's Profit</h3>
              <IndianRupeeIcon className="h-5 w-5 text-[#FF3000]" />
            </div>
            <div>
              <div className="text-4xl font-black text-black">₹{todayProfit?.toFixed(2)}</div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center mt-1">
                {profitChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={profitChange >= 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(profitChange)?.toFixed(1)}%
                </span>{" "}
                <span className="ml-1">from yesterday</span>
              </p>
            </div>
          </div>

          <div className="swiss-card p-4 flex flex-col justify-between">
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-black">This Week</h3>
              <CalendarDays className="h-5 w-5 text-[#FF3000]" />
            </div>
            <div>
              <div className="text-4xl font-black text-black">₹{thisWeekProfit.toFixed(2)}</div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{thisWeekOrders.length} orders</p>
            </div>
          </div>

          <div className="swiss-card p-4 flex flex-col justify-between">
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-black">This Month</h3>
              <CalendarDays className="h-5 w-5 text-[#FF3000]" />
            </div>
            <div>
              <div className="text-4xl font-black text-black">₹{thisMonthProfit.toFixed(2)}</div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{thisMonthOrders.length} orders</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="swiss-card">
          <div className="border-b-2 border-black p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-black">Profit Trend</h2>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">
                  Daily profit for week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
                  className="px-4 py-2 bg-white text-black font-bold uppercase tracking-widest text-[10px] border-2 border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev Week
                </button>
                <button
                  onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                  disabled={currentWeekOffset >= 0}
                  className="px-4 py-2 bg-white text-black font-bold uppercase tracking-widest text-[10px] border-2 border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  Next Week
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white">
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => format((value), "EEE")} />
                <YAxis />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 shadow-xl">
                          <p className="font-medium text-white">{data.fullDate}</p>
                          <p className="text-sm text-gray-400">
                            Profit:{" "}
                            <span className="font-medium text-emerald-400">₹ {payload[0].value?.toFixed(2)}</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="profit"
                  fill="var(--color-profit)"
                  radius={4}
                  className="cursor-pointer hover:opacity-80"
                  onClick={(data) => {
                    if (data && data.date) {
                      setSelectedDate(parseISO(data.date))
                      setActiveTab("daily")
                    }
                  }}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Orders History */}
        <div className="swiss-card bg-white">
          <div className="border-b-2 border-black p-4">
            <h2 className="text-xl font-black uppercase tracking-tighter text-black">Orders History</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">View and manage all your orders</p>
          </div>
          <div className="p-4">
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full p-3 swiss-input"
                  />
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-[#F2F2F2] border-2 border-black rounded-none p-1 gap-1">
                  <TabsTrigger
                    value="all"
                    className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    All Orders
                  </TabsTrigger>
                  <TabsTrigger
                    value="today"
                    className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Today
                  </TabsTrigger>
                  <TabsTrigger
                    value="yesterday"
                    className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Yesterday
                  </TabsTrigger>
                  <TabsTrigger
                    value="daily"
                    className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Daily Profit
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom"
                    className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Custom Range
                  </TabsTrigger>
                </TabsList>

                {activeTab === "custom" && (
                  <div className="mt-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[280px] justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {activeTab === "daily" && (
                  <div className="mt-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[280px] justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "MMMM d, yyyy") : <span>Select a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <TabsContent value="daily" className="mt-4">
                  {selectedDate ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card className="bg-gray-900 border-gray-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-white">Selected Date</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-white">{format(selectedDate, "MMM d, yyyy")}</div>
                            <p className="text-xs text-gray-400">{format(selectedDate, "EEEE")}</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gray-900 border-gray-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-white">Daily Profit</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                              ₹{getProfit(format(selectedDate, "yyyy-MM-dd"))?.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">Total profit for this day</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gray-900 border-gray-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-white">Orders Count</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-white">
                              {
                                mockOrders?.filter(
                                  (order) =>
                                    format((order.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"),
                                ).length
                              }
                            </div>
                            <p className="text-xs text-muted-foreground">Orders on this day</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="rounded-md border border-gray-800 bg-gray-900">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-800 hover:bg-gray-800/50">
                              <TableHead className="text-gray-300">Order ID</TableHead>
                              <TableHead className="text-gray-300">Customer Name</TableHead>
                              <TableHead className="text-gray-300">Order Value</TableHead>
                              <TableHead className="text-gray-300">Profit</TableHead>
                              <TableHead className="text-gray-300">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockOrders?.filter(
                                (order) =>
                                  format((order.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"),
                              )
                              .map((order) => (
                                <TableRow
                                  key={order.$id}
                                  className="cursor-pointer hover:bg-gray-800/50 border-gray-800"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <TableCell className="font-medium text-white">{order.$id}</TableCell>
                                  <TableCell className="text-gray-300">{order.cusName}</TableCell>
                                  <TableCell className="text-gray-300">₹{order.oderValue?.toFixed(2)}</TableCell>
                                  <TableCell className="text-emerald-400 font-medium">
                                  ₹{order.profit?.toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="secondary"
                                      className="bg-emerald-900 text-emerald-300 border-emerald-800"
                                    >
                                      Completed
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <CalendarDays className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Select a date to view daily profit details</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value={activeTab} className="mt-4">
                  {(activeTab === "all" ||
                    activeTab === "today" ||
                    activeTab === "yesterday" ||
                    activeTab === "custom") && (
                    <div className="border-2 border-black bg-white overflow-hidden">
                      <Table>
                        <TableHeader className="bg-black text-white">
                          <TableRow className="border-b-2 border-black hover:bg-black">
                            <TableHead className="text-white font-black uppercase tracking-widest text-xs">Order ID</TableHead>
                            <TableHead className="text-white font-black uppercase tracking-widest text-xs">Date</TableHead>
                            <TableHead className="text-white font-black uppercase tracking-widest text-xs">Customer Name</TableHead>
                            <TableHead className="text-white font-black uppercase tracking-widest text-xs border-r border-gray-600">Order Value</TableHead>
                            <TableHead className="text-white font-black uppercase tracking-widest text-xs">Profit</TableHead>
                            <TableHead className="text-white font-black uppercase tracking-widest text-xs">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order) => (
                            <TableRow
                              key={order.$id}
                              className="cursor-pointer hover:bg-[#F2F2F2] border-b border-black"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <TableCell className="font-bold text-black uppercase">{order.$id}</TableCell>
                              <TableCell className="text-black font-medium">
                                {format((order.date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-black font-bold">{order.cusName}</TableCell>
                              <TableCell className="text-black font-medium border-r border-gray-200">₹{order.oderValue}</TableCell>
                              <TableCell className="text-[#FF3000] font-black">₹{order.profit?.toFixed(2)}</TableCell>
                              <TableCell>
                                <span className="px-2 py-1 bg-black text-white text-[10px] uppercase font-bold tracking-widest">
                                  Completed
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="swiss-card max-w-4xl max-h-[80vh] overflow-y-auto p-0 rounded-none bg-white border-2 border-black">
            <DialogHeader className="border-b-2 border-black p-4 sticky top-0 bg-white z-10">
              <DialogTitle className="text-xl font-black uppercase tracking-widest text-[#FF3000]">Order Details - {selectedOrder?.$id}</DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="p-6 space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-2 border-black p-4">
                    <h3 className="font-black uppercase tracking-widest text-xs border-b-2 border-black pb-2 mb-2">Customer Information</h3>
                    <div className="space-y-1 text-sm font-bold uppercase tracking-widest text-gray-600">
                      <p>
                        <span className="text-black">Name:</span> {selectedOrder.cusName}
                      </p>
                      <p>
                        <span className="text-black">Mobile:</span> {selectedOrder.cusMobNum}
                      </p>
                      <p>
                        <span className="text-black">Date:</span>{" "}
                        {format((selectedOrder.date), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="border-2 border-black p-4">
                    <h3 className="font-black uppercase tracking-widest text-xs border-b-2 border-black pb-2 mb-2">Order Summary</h3>
                    <div className="space-y-1 text-sm font-bold uppercase tracking-widest text-gray-600">
                      <p>
                        <span className="text-black">Order Value:</span> 
                        ₹{selectedOrder.oderValue}
                      </p>
                      <p>
                        <span className="text-black">Profit:</span>{" "}
                        <span className="text-[#FF3000]">₹{selectedOrder.profit?.toFixed(2)}</span>
                      </p>
                      <p>
                        <span className="text-black">Items:</span> {selectedOrder.orderItems.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-2 border-black">
                  <div className="bg-black text-white p-3 border-b-2 border-black">
                    <h3 className="font-black uppercase tracking-widest text-xs">Order Items</h3>
                  </div>
                  <div className="overflow-auto bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-2 border-black hover:bg-transparent">
                          <TableHead className="text-black font-black uppercase tracking-widest text-xs">Product Name</TableHead>
                          <TableHead className="text-black font-black uppercase tracking-widest text-xs">Quantity</TableHead>
                          <TableHead className="text-black font-black uppercase tracking-widest text-xs">Price</TableHead>
                          <TableHead className="text-black font-black uppercase tracking-widest text-xs">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {JSON.parse(selectedOrder.orderItems).map((item, index) => (
                          <TableRow key={index} className="border-b border-black hover:bg-[#F2F2F2]">
                            <TableCell className="font-bold text-black uppercase">{item.productName}</TableCell>
                            <TableCell className="font-medium text-black">{item.quantity}</TableCell>
                            <TableCell className="font-medium text-black">₹{item.price}</TableCell>
                            <TableCell className="font-black text-[#FF3000]">₹{(item.quantity * item.price)?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Order Total */}
                <div className="flex justify-end pt-4">
                  <div className="text-right space-y-1 border-t-4 border-black pt-2 min-w-48">
                    <p className="text-xl font-black text-black uppercase flex justify-between tracking-widest">
                      <span>Total:</span>
                      <span>₹{selectedOrder.oderValue?.toFixed(2)}</span>
                    </p>
                    <p className="text-sm text-[#FF3000] font-black uppercase tracking-widest flex justify-between">
                      <span>Profit:</span>
                      <span>₹{selectedOrder.profit?.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
