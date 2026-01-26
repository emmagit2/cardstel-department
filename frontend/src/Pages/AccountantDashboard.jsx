import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Building2,
  TrendingUp,
  CreditCard,
  XCircle,
  Plus,
  Users
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MetricCard from '../components/shared/MetricCard';
import FilterBar from '../components/shared/FilterBar';
import ExportButton from '../components/shared/ExportButton';
import DataTable from '../components/shared/DataTable';
import ChartCard from '../components/shared/ChartCard';
import StatusBadge from '../components/shared/StatusBadge';
import PurchaseRequestForm from '../components/forms/PurchaseRequestForm';
import PurchaseForm from '../components/forms/PurchaseForm';

export default function AccountantDashboard() {
  const [filters, setFilters] = useState({});
  const [purchaseFilters, setPurchaseFilters] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [queryForm, setQueryForm] = useState({
    vendor: '',
    item: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
  });

  const { data: requests = [], isLoading: loadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['purchase-requests'],
    queryFn: () => base44.entities.PurchaseRequest.list('-created_date', 500),
    refetchInterval: 30000,
  });

  const { data: purchases = [], isLoading: loadingPurchases, refetch: refetchPurchases } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => base44.entities.Purchase.list('-created_date', 500),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const unsub1 = base44.entities.PurchaseRequest.subscribe(() => refetchRequests());
    const unsub2 = base44.entities.Purchase.subscribe(() => refetchPurchases());
    return () => { unsub1(); unsub2(); };
  }, [refetchRequests, refetchPurchases]);

  // Filter requests
  const filteredRequests = requests.filter(record => {
    if (filters.search && !record.item_service_name?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !record.requester_name?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && record.approval_status !== filters.status) return false;
    if (filters.type && filters.type !== 'all' && record.request_type !== filters.type) return false;
    if (filters.date) {
      const recordDate = new Date(record.created_date).toDateString();
      const filterDate = new Date(filters.date).toDateString();
      if (recordDate !== filterDate) return false;
    }
    return true;
  });

  // Filter purchases
  const filteredPurchases = purchases.filter(record => {
    if (purchaseFilters.search && !record.item_service_name?.toLowerCase().includes(purchaseFilters.search.toLowerCase()) &&
        !record.vendor?.toLowerCase().includes(purchaseFilters.search.toLowerCase())) {
      return false;
    }
    if (purchaseFilters.vendor && purchaseFilters.vendor !== 'all' && record.vendor !== purchaseFilters.vendor) return false;
    if (purchaseFilters.paymentStatus && purchaseFilters.paymentStatus !== 'all' && record.payment_status !== purchaseFilters.paymentStatus) return false;
    if (purchaseFilters.date) {
      const recordDate = new Date(record.created_date).toDateString();
      const filterDate = new Date(purchaseFilters.date).toDateString();
      if (recordDate !== filterDate) return false;
    }
    return true;
  });

  // Custom query results
  const queryResults = purchases.filter(p => {
    if (queryForm.vendor && !p.vendor?.toLowerCase().includes(queryForm.vendor.toLowerCase())) return false;
    if (queryForm.item && !p.item_service_name?.toLowerCase().includes(queryForm.item.toLowerCase())) return false;
    if (queryForm.status && queryForm.status !== 'all' && p.payment_status !== queryForm.status) return false;
    if (queryForm.dateFrom && new Date(p.purchase_date) < new Date(queryForm.dateFrom)) return false;
    if (queryForm.dateTo && new Date(p.purchase_date) > new Date(queryForm.dateTo)) return false;
    if (queryForm.minAmount && p.total_amount < parseFloat(queryForm.minAmount)) return false;
    if (queryForm.maxAmount && p.total_amount > parseFloat(queryForm.maxAmount)) return false;
    return true;
  });

  // Metrics
  const requestMetrics = {
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.approval_status === 'Pending').length,
    approved: filteredRequests.filter(r => r.approval_status === 'Approved').length,
    rejected: filteredRequests.filter(r => r.approval_status === 'Rejected').length,
    totalAmount: filteredRequests.reduce((sum, r) => sum + (r.requested_amount || 0), 0),
  };

  const purchaseMetrics = {
    total: filteredPurchases.length,
    totalSpent: filteredPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0),
    pendingPayments: filteredPurchases.filter(p => p.payment_status === 'Pending').reduce((sum, p) => sum + (p.total_amount || 0), 0),
    overduePayments: filteredPurchases.filter(p => p.payment_status === 'Overdue').reduce((sum, p) => sum + (p.total_amount || 0), 0),
    uniqueVendors: [...new Set(filteredPurchases.map(p => p.vendor))].length,
  };

  const vendors = [...new Set(purchases.map(p => p.vendor))].filter(Boolean);

  // Charts
  const statusData = ['Pending', 'Approved', 'Rejected', 'Ended', 'Cancelled'].map(status => ({
    name: status,
    value: filteredRequests.filter(r => r.approval_status === status).length,
  })).filter(d => d.value > 0);

  const vendorSpending = vendors.slice(0, 10).map(vendor => ({
    name: vendor.length > 12 ? vendor.substring(0, 12) + '...' : vendor,
    amount: filteredPurchases.filter(p => p.vendor === vendor).reduce((sum, p) => sum + (p.total_amount || 0), 0),
  })).sort((a, b) => b.amount - a.amount);

  const monthlySpending = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const monthPurchases = purchases.filter(p => {
      const pDate = new Date(p.purchase_date);
      return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === year;
    });
    return {
      name: month,
      spending: monthPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0),
    };
  });

  const paymentStatusData = [
    { name: 'Paid', value: filteredPurchases.filter(p => p.payment_status === 'Paid').length },
    { name: 'Pending', value: filteredPurchases.filter(p => p.payment_status === 'Pending').length },
    { name: 'Overdue', value: filteredPurchases.filter(p => p.payment_status === 'Overdue').length },
    { name: 'Partial', value: filteredPurchases.filter(p => p.payment_status === 'Partial').length },
  ].filter(d => d.value > 0);

  const requestFilterConfig = [
    { key: 'search', type: 'search', placeholder: 'Search item or requester...' },
    { key: 'status', type: 'select', label: 'Status', placeholder: 'Status', options: [
      { value: 'Pending', label: 'Pending' },
      { value: 'Approved', label: 'Approved' },
      { value: 'Rejected', label: 'Rejected' },
      { value: 'Ended', label: 'Ended' },
      { value: 'Cancelled', label: 'Cancelled' },
    ]},
    { key: 'type', type: 'select', label: 'Type', placeholder: 'Type', options: [
      { value: 'Goods', label: 'Goods' },
      { value: 'Services', label: 'Services' },
    ]},
    { key: 'date', type: 'date', placeholder: 'Select date' },
  ];

  const purchaseFilterConfig = [
    { key: 'search', type: 'search', placeholder: 'Search item or vendor...' },
    { key: 'vendor', type: 'select', label: 'Vendors', placeholder: 'Vendor', options: vendors.map(v => ({ value: v, label: v })) },
    { key: 'paymentStatus', type: 'select', label: 'Payment', placeholder: 'Payment Status', options: [
      { value: 'Pending', label: 'Pending' },
      { value: 'Paid', label: 'Paid' },
      { value: 'Overdue', label: 'Overdue' },
      { value: 'Partial', label: 'Partial' },
    ]},
    { key: 'date', type: 'date', placeholder: 'Select date' },
  ];

  const requestColumns = [
    { key: 'item_service_name', label: 'Item/Service' },
    { key: 'request_type', label: 'Type', type: 'status' },
    { key: 'requester_name', label: 'Requester' },
    { key: 'department', label: 'Department' },
    { key: 'requested_quantity', label: 'Quantity', type: 'number' },
    { key: 'requested_amount', label: 'Amount', type: 'currency' },
    { key: 'approval_status', label: 'Status', type: 'status' },
    { key: 'request_date', label: 'Request Date', type: 'date' },
  ];

  const purchaseColumns = [
    { key: 'vendor', label: 'Vendor' },
    { key: 'item_service_name', label: 'Item/Service' },
    { key: 'purchase_type', label: 'Type', type: 'status' },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'unit_price', label: 'Unit Price', type: 'currency' },
    { key: 'total_amount', label: 'Total', type: 'currency' },
    { key: 'payment_status', label: 'Payment', type: 'status' },
    { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    { key: 'due_date', label: 'Due Date', type: 'date' },
  ];

  const requestExportColumns = requestColumns.map(c => ({ key: c.key, label: c.label, accessor: (row) => row[c.key] }));
  const purchaseExportColumns = purchaseColumns.map(c => ({ key: c.key, label: c.label, accessor: (row) => row[c.key] }));

  const isLoading = loadingRequests || loadingPurchases;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Accountant Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Manage purchase requests, tracking, and vendor payments</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Total Spent" value={`₦${purchaseMetrics.totalSpent.toLocaleString()}`} icon={DollarSign} variant="primary" />
          <MetricCard title="Pending Requests" value={requestMetrics.pending} icon={Clock} variant="warning" />
          <MetricCard title="Overdue Payments" value={`₦${purchaseMetrics.overduePayments.toLocaleString()}`} icon={AlertTriangle} variant={purchaseMetrics.overduePayments > 0 ? "danger" : "default"} />
          <MetricCard title="Vendors" value={purchaseMetrics.uniqueVendors} icon={Building2} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="query">Custom Query</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Request Status Distribution"
                subtitle="Approval status breakdown"
                type="pie"
                data={statusData}
                dataKey="value"
              />
              <ChartCard
                title="Payment Status"
                subtitle="Current payment status"
                type="pie"
                data={paymentStatusData}
                dataKey="value"
                colors={['#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
              />
              <ChartCard
                title="Monthly Spending"
                subtitle="Last 6 months"
                type="line"
                data={monthlySpending}
                dataKey="spending"
              />
              <ChartCard
                title="Top Vendors by Spending"
                subtitle="Total purchase amount"
                type="bar"
                data={vendorSpending.slice(0, 8)}
                dataKey="amount"
                colors={['#3b82f6']}
              />
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-6 space-y-4">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <FilterBar
                filters={requestFilterConfig}
                values={filters}
                onChange={setFilters}
                onReset={() => setFilters({})}
                className="flex-1"
              />
              <div className="flex gap-2">
                <ExportButton data={filteredRequests} filename="purchase-requests" columns={requestExportColumns} />
                <Button onClick={() => setShowRequestDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Request
                </Button>
              </div>
            </div>
            <DataTable
              columns={requestColumns}
              data={filteredRequests}
              highlightCondition={(row) => row.approval_status === 'Pending'}
              emptyMessage="No purchase requests found"
            />
          </TabsContent>

          <TabsContent value="purchases" className="mt-6 space-y-4">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <FilterBar
                filters={purchaseFilterConfig}
                values={purchaseFilters}
                onChange={setPurchaseFilters}
                onReset={() => setPurchaseFilters({})}
                className="flex-1"
              />
              <div className="flex gap-2">
                <ExportButton data={filteredPurchases} filename="purchases" columns={purchaseExportColumns} />
                <Button onClick={() => setShowPurchaseDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Purchase
                </Button>
              </div>
            </div>
            <DataTable
              columns={purchaseColumns}
              data={filteredPurchases}
              highlightCondition={(row) => row.payment_status === 'Overdue'}
              emptyMessage="No purchases found"
            />
          </TabsContent>

          <TabsContent value="query" className="mt-6 space-y-6">
            <Card className="p-6 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Custom Query Form</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Vendor</Label>
                  <Input 
                    placeholder="Search vendor..." 
                    value={queryForm.vendor}
                    onChange={(e) => setQueryForm({...queryForm, vendor: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Item/Service</Label>
                  <Input 
                    placeholder="Search item..." 
                    value={queryForm.item}
                    onChange={(e) => setQueryForm({...queryForm, item: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <Select value={queryForm.status} onValueChange={(v) => setQueryForm({...queryForm, status: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date From</Label>
                  <Input 
                    type="date" 
                    value={queryForm.dateFrom}
                    onChange={(e) => setQueryForm({...queryForm, dateFrom: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Date To</Label>
                  <Input 
                    type="date" 
                    value={queryForm.dateTo}
                    onChange={(e) => setQueryForm({...queryForm, dateTo: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Min Amount (₦)</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={queryForm.minAmount}
                    onChange={(e) => setQueryForm({...queryForm, minAmount: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Max Amount (₦)</Label>
                  <Input 
                    type="number" 
                    placeholder="No limit"
                    value={queryForm.maxAmount}
                    onChange={(e) => setQueryForm({...queryForm, maxAmount: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setQueryForm({ vendor: '', item: '', status: '', dateFrom: '', dateTo: '', minAmount: '', maxAmount: '' })}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </Card>

            {/* Query Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard 
                title="Results Found" 
                value={queryResults.length} 
                icon={FileText} 
              />
              <MetricCard 
                title="Total Amount" 
                value={`₦${queryResults.reduce((sum, p) => sum + (p.total_amount || 0), 0).toLocaleString()}`} 
                icon={DollarSign}
                variant="success"
              />
              <MetricCard 
                title="Unique Vendors" 
                value={[...new Set(queryResults.map(p => p.vendor))].length} 
                icon={Building2} 
              />
            </div>

            <div className="flex justify-end">
              <ExportButton data={queryResults} filename="query-results" columns={purchaseExportColumns} />
            </div>
            
            <DataTable
              columns={purchaseColumns}
              data={queryResults}
              emptyMessage="No results match your query"
            />
          </TabsContent>

          <TabsContent value="staff" className="mt-6">
            <Card className="p-6 border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Staff Management</h3>
                  <p className="text-sm text-slate-500 mt-1">Manage staff members, roles, and departments</p>
                </div>
                <Button onClick={() => window.location.href = '#/StaffManagement'}>
                  <Users className="w-4 h-4 mr-2" />
                  Open Staff Management
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Purchase Request</DialogTitle>
          </DialogHeader>
          <PurchaseRequestForm
            onSubmit={async (data) => {
              await base44.entities.PurchaseRequest.create(data);
              refetchRequests();
              setShowRequestDialog(false);
            }}
            onCancel={() => setShowRequestDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Purchase</DialogTitle>
          </DialogHeader>
          <PurchaseForm
            onSubmit={async (data) => {
              await base44.entities.Purchase.create(data);
              refetchPurchases();
              setShowPurchaseDialog(false);
            }}
            onCancel={() => setShowPurchaseDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}