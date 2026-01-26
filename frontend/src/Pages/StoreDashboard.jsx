import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MetricCard from '../components/shared/MetricCard';
import FilterBar from '../components/shared/FilterBar';
import ExportButton from '../components/shared/ExportButton';
import DataTable from '../components/shared/DataTable';
import ChartCard from '../components/shared/ChartCard';
import StoreForm from '../components/forms/StoreForm';
import VendorForm from '../components/forms/VendorForm';
import CategoryForm from '../components/forms/CategoryForm';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

import { fetchInventory, fetchCurrentUser, fetchVendors, fetchCategories } from '@/api/api_name';

// --------------------------------------
// Placeholder actions for form submissions
// --------------------------------------
export const actions = {
  addItem: async (data) => {
    console.log('Add Item Action:', data);
    // TODO: Call API endpoint to add item
    return { success: true };
  },
  addVendor: async (data) => {
    console.log('Add Vendor Action:', data);
    // TODO: Call API endpoint to add vendor
    return { success: true };
  },
  addCategory: async (data) => {
    console.log('Add Category Action:', data);
    // TODO: Call API endpoint to add category
    return { success: true };
  }
};

// --------------------------------------
// Main Dashboard Component
// --------------------------------------
export default function StoreDashboard() {
  const [filters, setFilters] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddVendorDialog, setShowAddVendorDialog] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
  });

  const { data: records = [], isLoading: isInventoryLoading } = useQuery({
    queryKey: ['store-inventory'],
    queryFn: fetchInventory,
    refetchInterval: 30000,
  });

  const { data: vendorsList = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
  });

  const { data: categoriesList = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!record.item_name?.toLowerCase().includes(search) &&
            !record.vendor?.toLowerCase().includes(search)) return false;
      }
      if (filters.vendor && filters.vendor !== 'all' && record.vendor !== filters.vendor) return false;
      if (filters.category && filters.category !== 'all' && record.category !== filters.category) return false;
      if (filters.confirmed && filters.confirmed !== 'all') {
        const isConfirmed = record.is_confirmed;
        if (filters.confirmed === 'confirmed' && !isConfirmed) return false;
        if (filters.confirmed === 'pending' && isConfirmed) return false;
      }
      if (filters.date) {
        const recordDate = new Date(record.created_at).toDateString();
        const filterDate = new Date(filters.date).toDateString();
        if (recordDate !== filterDate) return false;
      }
      return true;
    });
  }, [records, filters]);

  const metrics = useMemo(() => ({
    totalItems: filteredRecords.length,
    totalReceived: filteredRecords.reduce((sum, r) => sum + (r.quantity_received || 0), 0),
    pendingConfirmations: filteredRecords.filter(r => !r.is_confirmed).length,
    confirmedItems: filteredRecords.filter(r => r.is_confirmed).length,
    discrepancies: filteredRecords.filter(r => r.quantity_requested && r.quantity_received !== r.quantity_requested).length,
  }), [filteredRecords]);

  const vendorData = useMemo(() => {
    return vendorsList.slice(0, 10).map(vendor => {
      const vendorRecords = filteredRecords.filter(r => r.vendor === vendor);
      return {
        name: vendor.length > 15 ? vendor.substring(0, 15) + '...' : vendor,
        quantity: vendorRecords.reduce((sum, r) => sum + (r.quantity_received || 0), 0),
      };
    });
  }, [vendorsList, filteredRecords]);

  const categoryData = useMemo(() => {
    return categoriesList.map(cat => ({
      name: cat,
      value: filteredRecords.filter(r => r.category === cat)
                            .reduce((sum, r) => sum + (r.quantity_received || 0), 0),
    })).filter(d => d.value > 0);
  }, [categoriesList, filteredRecords]);

  const filterConfig = [
    { key: 'search', type: 'search', placeholder: 'Search item or vendor...' },
    { key: 'vendor', type: 'select', label: 'Vendors', placeholder: 'Vendor', options: vendorsList.map(v => ({ value: v, label: v })) },
    { key: 'category', type: 'select', label: 'Categories', placeholder: 'Category', options: categoriesList.map(c => ({ value: c, label: c })) },
    { key: 'confirmed', type: 'select', label: 'Status', placeholder: 'Confirmation', options: [
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'pending', label: 'Pending' },
    ]},
    { key: 'date', type: 'date', placeholder: 'Select date' },
  ];

  const columns = [
    { key: 'item_name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'quantity_received', label: 'Qty Received', type: 'number' },
    { key: 'quantity_requested', label: 'Qty Requested', type: 'number' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'is_confirmed', label: 'Confirmed', render: val => val ? 'Yes' : 'Pending' },
    { key: 'seen_count', label: 'Seen By', render: val => `${val || 0} people` },
    { key: 'fixed_by', label: 'Fixed By' },
    { key: 'created_at', label: 'Date', type: 'date' },
  ];

  const exportColumns = columns.map(c => ({
    key: c.key,
    label: c.label,
    accessor: row => c.render ? c.render(row[c.key]) : row[c.key],
  }));

  if (isInventoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="animate-pulse text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Store Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Track items received and confirm stock levels</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filteredRecords} filename="store-inventory" columns={exportColumns} />
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
          <Button variant="outline" onClick={() => setShowAddVendorDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Vendor
          </Button>
          <Button variant="outline" onClick={() => setShowAddCategoryDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <StoreForm
            onSubmit={(data) => { actions.addItem(data); setShowAddDialog(false); }}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddVendorDialog} onOpenChange={setShowAddVendorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <VendorForm
            onSubmit={(data) => { actions.addVendor(data); setShowAddVendorDialog(false); }}
            onCancel={() => setShowAddVendorDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSubmit={(data) => { actions.addCategory(data); setShowAddCategoryDialog(false); }}
            onCancel={() => setShowAddCategoryDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Total Items" value={metrics.totalItems} icon={Package} variant="primary" />
          <MetricCard title="Confirmed" value={metrics.confirmedItems} icon={CheckCircle} variant="success" />
          <MetricCard title="Pending" value={metrics.pendingConfirmations} icon={Clock} variant={metrics.pendingConfirmations > 0 ? "warning" : "default"} />
          <MetricCard title="Discrepancies" value={metrics.discrepancies} icon={AlertTriangle} variant={metrics.discrepancies > 0 ? "danger" : "default"} />
        </div>

        {/* Filters */}
        <FilterBar filters={filterConfig} values={filters} onChange={setFilters} onReset={() => setFilters({})} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Inventory by Category" subtitle="Quantity distribution" type="pie" data={categoryData} dataKey="value" />
            <ChartCard title="Top Vendors" subtitle="By quantity received" type="bar" data={vendorData.slice(0, 5)} dataKey="quantity" />
          </TabsContent>

          <TabsContent value="records" className="mt-6">
            <DataTable columns={columns} data={filteredRecords} onRowClick={setSelectedItem} emptyMessage="No inventory records found" />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Vendor Performance" subtitle="Total quantity by vendor" type="bar" data={vendorData} dataKey="quantity" />
            <ChartCard title="Stock Levels by Category" subtitle="Quantity received" type="bar" data={categoryData} dataKey="value" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// --------------------------------------
// Named exports for forms
// --------------------------------------
export { StoreForm, VendorForm, CategoryForm };
