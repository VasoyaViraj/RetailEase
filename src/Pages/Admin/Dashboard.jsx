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
// import mockOrders from '../../../mockOrders.json'

const chartConfig = {
  profit: {
    label: "Profit ($)",
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

  // Calculate metrics
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

  // Calculate current week based on offset
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

  // Generate chart data for the current week
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

  // Filter orders based on active tab and search
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
      const dbId = '6810918b0009c28b3b9d';
      const collectionId = '685586b10032ef98eed5';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">RetailEase Dashboard</h1>
            <p className="text-gray-400">Monitor your POS system performance</p>
          </div>
          <div className="text-sm text-gray-400">{format(today, "EEEE, MMMM d, yyyy")}</div>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Today's Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-white font-bold">{todayOrders.length}</div>
              <p className="text-xs text-white/40 ">
                {todayOrders.length > yesterdayOrders.length ? "+" : ""}
                {todayOrders.length - yesterdayOrders.length} from yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Today's Profit</CardTitle>
              <IndianRupeeIcon className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">₹{todayProfit?.toFixed(2)}</div>
              <p className="text-xs text-gray-400 flex items-center">
                {profitChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400 mr-1" />
                )}
                <span className={profitChange >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {Math.abs(profitChange)?.toFixed(1)}%
                </span>{" "}
                from yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">This Week</CardTitle>
              <CalendarDays className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-white font-bold">₹{thisWeekProfit.toFixed(2)}</div>
              <p className="text-xs text-white/40">{thisWeekOrders.length} orders</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">This Month</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-white font-bold">₹{thisMonthProfit.toFixed(2)}</div>
              <p className="text-xs text-white/40">{thisMonthOrders.length} orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Profit Chart */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Profit Trend</CardTitle>
                <CardDescription className="text-gray-400">
                  Daily profit for week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                  disabled={currentWeekOffset >= 0}
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  Next Week
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                            <span className="font-medium text-emerald-400">${payload[0].value?.toFixed(2)}</span>
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
          </CardContent>
        </Card>

        {/* Orders History */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Orders History</CardTitle>
            <CardDescription className="text-gray-400">View and manage all your orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-800 border-gray-700">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300"
                  >
                    All Orders
                  </TabsTrigger>
                  <TabsTrigger
                    value="today"
                    className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300"
                  >
                    Today
                  </TabsTrigger>
                  <TabsTrigger
                    value="yesterday"
                    className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300"
                  >
                    Yesterday
                  </TabsTrigger>
                  <TabsTrigger
                    value="daily"
                    className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300"
                  >
                    Daily Profit
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom"
                    className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300"
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
                              ${getProfit(format(selectedDate, "yyyy-MM-dd"))?.toFixed(2)}
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
                                  <TableCell className="text-gray-300">${order.oderValue?.toFixed(2)}</TableCell>
                                  <TableCell className="text-emerald-400 font-medium">
                                    ${order.profit?.toFixed(2)}
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
                    <div className="rounded-md border border-gray-800 bg-gray-900">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-800 hover:bg-gray-800/50">
                            <TableHead className="text-gray-300">Order ID</TableHead>
                            <TableHead className="text-gray-300">Date</TableHead>
                            <TableHead className="text-gray-300">Customer Name</TableHead>
                            <TableHead className="text-gray-300">Order Value</TableHead>
                            <TableHead className="text-gray-300">Profit</TableHead>
                            <TableHead className="text-gray-300">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order) => (
                            <TableRow
                              key={order.$id}
                              className="cursor-pointer hover:bg-gray-800/50 border-gray-800"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <TableCell className="font-medium text-white">{order.$id}</TableCell>
                              <TableCell className="text-gray-300">
                                {format((order.date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-gray-300">{order.cusName}</TableCell>
                              <TableCell className="text-gray-300">$ {order.oderValue}</TableCell>
                              <TableCell className="text-emerald-400 font-medium">₹{order.profit?.toFixed(2)}</TableCell>
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
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Order Details - {selectedOrder?.$id}</DialogTitle>
              <DialogDescription className="text-gray-400">Complete information about this order</DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-white">Customer Information</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">
                        <span className="font-medium text-white">Name:</span> {selectedOrder.cusName}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium text-white">Mobile:</span> {selectedOrder.cusMobNum}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium text-white">Date:</span>{" "}
                        {format((selectedOrder.date), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-white">Order Summary</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">
                        <span className="font-medium text-white">Order Value:</span> ₹
                        {selectedOrder.oderValue}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium text-white">Profit:</span>{" "}
                        <span className="text-emerald-400">₹{selectedOrder.profit?.toFixed(2)}</span>
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium text-white">Items:</span> {selectedOrder.orderItems.length}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-4 text-white">Order Items</h3>
                  <div className="rounded-md border border-gray-800 bg-gray-900">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-300">Product Name</TableHead>
                          {/* <TableHead className="text-gray-300">Barcode</TableHead> */}
                          <TableHead className="text-gray-300">Quantity</TableHead>
                          <TableHead className="text-gray-300">Price</TableHead>
                          <TableHead className="text-gray-300">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {JSON.parse(selectedOrder.orderItems).map((item, index) => (
                          <TableRow key={index} className="border-gray-800">
                            <TableCell className="font-medium text-white">{item.productName}</TableCell>
                            {/* <TableCell className="font-mono text-sm text-gray-300">{item.barcode}</TableCell> */}
                            <TableCell className="text-gray-300">{item.quantity}</TableCell>
                            <TableCell className="text-gray-300">₹{item.price}</TableCell>
                            <TableCell className="font-medium text-white">${(item.quantity * item.price)?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Order Total */}
                <div className="flex justify-end">
                  <div className="text-right space-y-1">
                    <p className="text-lg font-semibold text-white">Total: ₹{selectedOrder.oderValue?.toFixed(2)}</p>
                    <p className="text-sm text-emerald-400 font-medium">Profit: ₹{selectedOrder.profit?.toFixed(2)}</p>
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
