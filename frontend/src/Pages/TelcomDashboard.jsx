import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  RotateCcw, 
  AlertTriangle,
  Users,
  Zap,
  Activity,
  Plus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MetricCard from '../components/shared/MetricCard';
import StatusBadge from '../components/shared/StatusBadge';
import FilterBar from '../components/shared/FilterBar';
import ExportButton from '../components/shared/ExportButton';
import DataTable from '../components/shared/DataTable';
import ChartCard from '../components/shared/ChartCard';
import TelcomForm from '../components/forms/TelcomForm';

export default function TelcomDashboard() {
  const [filters, setFilters] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ['telcom-fulfillment'],
    queryFn: () => base44.entities.TelcomFulfillment.list('-created_date', 500),
    refetchInterval: 30000, // Real-time updates every 30s
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = base44.entities.TelcomFulfillment.subscribe(() => {
      refetch();
    });
    return unsubscribe;
  }, [refetch]);

  // Apply filters
  const filteredRecords = records.filter(record => {
    if (filters.search && !record.operator_name?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !record.telecom_brand?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.brand && filters.brand !== 'all' && record.telecom_brand !== filters.brand) return false;
    if (filters.status && filters.status !== 'all' && record.status !== filters.status) return false;
    if (filters.shift && filters.shift !== 'all' && record.shift !== filters.shift) return false;
    if (filters.date) {
      const recordDate = new Date(record.created_date).toDateString();
      const filterDate = new Date(filters.date).toDateString();
      if (recordDate !== filterDate) return false;
    }
    return true;
  });

  // Calculate metrics
  const metrics = {
    totalReceived: filteredRecords.reduce((sum, r) => sum + (r.quantity_received || 0), 0),
    totalPacked: filteredRecords.reduce((sum, r) => sum + (r.quantity_packed || 0), 0),
    totalWIP: filteredRecords.reduce((sum, r) => sum + (r.quantity_wip || 0), 0),
    totalReconciled: filteredRecords.reduce((sum, r) => sum + (r.quantity_reconciled || 0), 0),
    totalReturned: filteredRecords.reduce((sum, r) => sum + (r.quantity_returned || 0), 0),
    discrepancies: filteredRecords.filter(r => r.has_discrepancy).length,
    uniqueOperators: [...new Set(filteredRecords.map(r => r.operator_name))].length,
  };

  // Charts data
  const brandData = ['Glo', 'Airtel', 'MTN', '9mobile'].map(brand => ({
    name: brand,
    received: filteredRecords.filter(r => r.telecom_brand === brand).reduce((sum, r) => sum + (r.quantity_received || 0), 0),
    packed: filteredRecords.filter(r => r.telecom_brand === brand).reduce((sum, r) => sum + (r.quantity_packed || 0), 0),
  }));

  const operatorData = [...new Set(filteredRecords.map(r => r.operator_name))].slice(0, 10).map(op => {
    const opRecords = filteredRecords.filter(r => r.operator_name === op);
    const totalProcessed = opRecords.reduce((sum, r) => sum + (r.quantity_packed || 0), 0);
    const totalTime = opRecords.reduce((sum, r) => {
      if (r.start_time && r.end_time) {
        return sum + (new Date(r.end_time) - new Date(r.start_time)) / 3600000;
      }
      return sum;
    }, 0);
    return {
      name: op || 'Unknown',
      efficiency: totalTime > 0 ? Math.round(totalProcessed / totalTime) : 0,
      total: totalProcessed,
    };
  }).filter(d => d.name);

  const statusData = ['Pending', 'Malating ongoing', 'Fully packed', 'Reconciled', 'Completed'].map(status => ({
    name: status,
    value: filteredRecords.filter(r => r.status === status).length,
  })).filter(d => d.value > 0);

  const filterConfig = [
    { key: 'search', type: 'search', placeholder: 'Search operator or brand...' },
    { key: 'brand', type: 'select', label: 'Brands', placeholder: 'Brand', options: [
      { value: 'Glo', label: 'Glo' },
      { value: 'Airtel', label: 'Airtel' },
      { value: 'MTN', label: 'MTN' },
      { value: '9mobile', label: '9mobile' },
    ]},
    { key: 'status', type: 'select', label: 'Status', placeholder: 'Status', options: [
      { value: 'Pending', label: 'Pending' },
      { value: 'Malating ongoing', label: 'Malating ongoing' },
      { value: 'Fully packed', label: 'Fully packed' },
      { value: 'Reconciled', label: 'Reconciled' },
      { value: 'Completed', label: 'Completed' },
    ]},
    { key: 'shift', type: 'select', label: 'Shifts', placeholder: 'Shift', options: [
      { value: 'Morning', label: 'Morning' },
      { value: 'Afternoon', label: 'Afternoon' },
      { value: 'Night', label: 'Night' },
    ]},
    { key: 'date', type: 'date', placeholder: 'Select date' },
  ];

  const columns = [
    { key: 'telecom_brand', label: 'Brand', type: 'status' },
    { key: 'operator_name', label: 'Operator' },
    { key: 'machine_used', label: 'Machine' },
    { key: 'quantity_received', label: 'Received', type: 'number' },
    { key: 'quantity_packed', label: 'Packed', type: 'number' },
    { key: 'quantity_wip', label: 'WIP', type: 'number' },
    { key: 'quantity_reconciled', label: 'Reconciled', type: 'number' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'shift', label: 'Shift', type: 'status' },
    { key: 'end_time', label: 'End Time', type: 'datetime' },
    { key: 'created_date', label: 'Date', type: 'date' },
  ];

  const exportColumns = columns.map(c => ({
    key: c.key,
    label: c.label,
    accessor: (row) => row[c.key],
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Telcom Fulfillment</h1>
            <p className="text-sm text-slate-500 mt-1">Monitor telecom card fulfillment lifecycle</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time
            </div>
            <ExportButton data={filteredRecords} filename="telcom-fulfillment" columns={exportColumns} />
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Total Received" value={metrics.totalReceived.toLocaleString()} icon={Package} variant="primary" />
          <MetricCard title="Packed" value={metrics.totalPacked.toLocaleString()} icon={CheckCircle} variant="success" />
          <MetricCard title="Work in Progress" value={metrics.totalWIP.toLocaleString()} icon={Clock} variant="warning" />
          <MetricCard title="Discrepancies" value={metrics.discrepancies} icon={AlertTriangle} variant={metrics.discrepancies > 0 ? "danger" : "default"} />
        </div>

        {/* Filters */}
        <FilterBar
          filters={filterConfig}
          values={filters}
          onChange={setFilters}
          onReset={() => setFilters({})}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Throughput by Brand"
                subtitle="Received vs Packed quantities"
                type="bar"
                data={brandData}
                dataKey={['received', 'packed']}
              />
              <ChartCard
                title="Status Distribution"
                subtitle="Current fulfillment status"
                type="pie"
                data={statusData}
                dataKey="value"
              />
            </div>
          </TabsContent>

          <TabsContent value="records" className="mt-6">
            <DataTable
              columns={columns}
              data={filteredRecords}
              highlightCondition={(row) => row.has_discrepancy}
              emptyMessage="No fulfillment records found"
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Operator Efficiency"
                subtitle="Cards processed per hour"
                type="bar"
                data={operatorData}
                dataKey="efficiency"
              />
              <ChartCard
                title="Total by Operator"
                subtitle="Total cards packed"
                type="bar"
                data={operatorData}
                dataKey="total"
                colors={['#10b981']}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Telcom Fulfillment Record</DialogTitle>
          </DialogHeader>
          <TelcomForm
            onSubmit={async (data) => {
              await base44.entities.TelcomFulfillment.create(data);
              refetch();
              setShowAddDialog(false);
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}