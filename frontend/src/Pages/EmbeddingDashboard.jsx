import React, { useState } from 'react';
import { fetchEmbedding } from '@/api/api_name';
import { useQuery } from '@tanstack/react-query';
import { Plus, CheckCircle, XCircle, TrendingUp, Cpu } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MetricCard from '../components/shared/MetricCard';
import FilterBar from '../components/shared/FilterBar';
import ExportButton from '../components/shared/ExportButton';
import DataTable from '../components/shared/DataTable';
import ChartCard from '../components/shared/ChartCard';
import EmbeddingForm from '../components/forms/EmbeddingForm';

export default function EmbeddingDashboard() {
  const [filters, setFilters] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch embedding records
 const { data: records = [], isLoading, refetch } = useQuery({
  queryKey: ['embedding-operations'],
  queryFn: async () => {
    const res = await fetchEmbedding();
    console.log('Embedding API response:', res); // should log the array
    return res || [];
  },
  refetchInterval: 30000,
});


  // Filter records dynamically
  const filteredRecords = records.filter(record => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (
        !record.operator_name?.toLowerCase().includes(search) &&
        !record.machine_name?.toLowerCase().includes(search)
      ) return false;
    }
    if (filters.machine && filters.machine !== 'all' && record.machine_name !== filters.machine) return false;
    if (filters.shift && filters.shift !== 'all' && record.shift !== filters.shift) return false;
    if (filters.date) {
      const recordDate = new Date(record.created_date).toDateString();
      const filterDate = new Date(filters.date).toDateString();
      if (recordDate !== filterDate) return false;
    }
    return true;
  });

  // Metrics
  const metrics = {
    totalReceived: filteredRecords.reduce((sum, r) => sum + (r.quantity_received || 0), 0),
    totalGood: filteredRecords.reduce((sum, r) => sum + (r.good_quantity || 0), 0),
    totalEmbedded: filteredRecords.reduce((sum, r) => sum + (r.quantity_embedded || 0), 0),
    totalRejected: filteredRecords.reduce((sum, r) => sum + (r.quantity_rejected || 0), 0),
  };

  const rejectionRate = metrics.totalReceived > 0
    ? ((metrics.totalRejected / metrics.totalReceived) * 100).toFixed(1)
    : 0;

  const machines = [...new Set(records.map(r => r.machine_name))].filter(Boolean);

  // Machine chart data
  const machineData = machines.map(machine => {
    const machineRecords = filteredRecords.filter(r => r.machine_name === machine);
    return {
      name: machine,
      embedded: machineRecords.reduce((sum, r) => sum + (r.quantity_embedded || 0), 0),
      rejected: machineRecords.reduce((sum, r) => sum + (r.quantity_rejected || 0), 0),
    };
  });

  // Operator efficiency
  const operatorData = [...new Set(filteredRecords.map(r => r.operator_name))].map(op => {
    const opRecords = filteredRecords.filter(r => r.operator_name === op);
    const totalEmbedded = opRecords.reduce((sum, r) => sum + (r.quantity_embedded || 0), 0);
    const totalHours = opRecords.reduce((sum, r) => {
      if (r.start_time && r.end_time) {
        return sum + (new Date(r.end_time) - new Date(r.start_time)) / 3600000;
      }
      return sum;
    }, 0);
    return {
      name: op,
      efficiency: totalHours > 0 ? Math.round(totalEmbedded / totalHours) : 0,
    };
  });

  // Rejection rate by machine
  const rejectionByMachine = machines.map(machine => {
    const machineRecords = filteredRecords.filter(r => r.machine_name === machine);
    const totalReceived = machineRecords.reduce((sum, r) => sum + (r.quantity_received || 0), 0);
    const totalRejected = machineRecords.reduce((sum, r) => sum + (r.quantity_rejected || 0), 0);
    return {
      name: machine,
      rate: totalReceived > 0 ? parseFloat(((totalRejected / totalReceived) * 100).toFixed(1)) : 0,
    };
  });

  // Filter configuration
  const filterConfig = [
    { key: 'search', type: 'search', placeholder: 'Search operator or machine...' },
    { key: 'machine', type: 'select', label: 'Machines', placeholder: 'Machine', options: machines.map(m => ({ value: m, label: m })) },
    { key: 'shift', type: 'select', label: 'Shifts', placeholder: 'Shift', options: [
      { value: 'Morning', label: 'Morning' },
      { value: 'Afternoon', label: 'Afternoon' },
      { value: 'Night', label: 'Night' },
    ]},
    { key: 'date', type: 'date', placeholder: 'Select date' },
  ];

  // Table columns
  const columns = [
    { key: 'operator_name', label: 'Operator' },
    { key: 'machine_name', label: 'Machine' },
    { key: 'quantity_received', label: 'Received', type: 'number' },
    { key: 'good_quantity', label: 'Good Qty', type: 'number' },
    { key: 'quantity_embedded', label: 'Embedded', type: 'number' },
    { key: 'quantity_rejected', label: 'Rejected', type: 'number' },
    { key: 'quantity_returned', label: 'Returned', type: 'number' },
    { key: 'shift', label: 'Shift', type: 'status' },
    { key: 'end_time', label: 'End Time', type: 'datetime' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'created_date', label: 'Date', type: 'date' },
  ];

  const exportColumns = columns.map(c => ({
    key: c.key,
    label: c.label,
    accessor: row => row[c.key],
  }));

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="animate-pulse text-slate-500">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Embedding Machine</h1>
          <p className="text-sm text-slate-500 mt-1">Track embedding operations and operator performance</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filteredRecords} filename="embedding-operations" columns={exportColumns} />
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Record
          </Button>
        </div>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-6">
        {/* METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Received" value={metrics.totalReceived.toLocaleString()} icon={Cpu} variant="primary" />
          <MetricCard title="Embedded" value={metrics.totalEmbedded.toLocaleString()} icon={CheckCircle} variant="success" />
          <MetricCard title="Rejected" value={metrics.totalRejected.toLocaleString()} icon={XCircle} variant="danger" />
          <MetricCard title="Rejection Rate" value={`${rejectionRate}%`} icon={TrendingUp} variant={parseFloat(rejectionRate) > 5 ? "danger" : "success"} />
        </div>

        {/* FILTERS */}
        <FilterBar filters={filterConfig} values={filters} onChange={setFilters} onReset={() => setFilters({})} />

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Production by Machine" subtitle="Embedded vs Rejected quantities" type="bar" data={machineData} dataKey={['embedded', 'rejected']} />
            <ChartCard title="Rejection Rate by Machine" subtitle="Percentage of rejected cards" type="bar" data={rejectionByMachine} dataKey="rate" />
          </TabsContent>

          <TabsContent value="records" className="mt-6">
            <DataTable columns={columns} data={filteredRecords} highlightCondition={row => row.has_discrepancy} emptyMessage="No embedding records found" />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Operator Efficiency" subtitle="Cards embedded per hour" type="bar" data={operatorData} dataKey="efficiency" />
            <ChartCard title="Machine Utilization" subtitle="Total embedded by machine" type="bar" data={machineData} dataKey="embedded" />
          </TabsContent>
        </Tabs>
      </div>

      {/* ADD RECORD DIALOG */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Embedding Operation Record</DialogTitle>
          </DialogHeader>

          <EmbeddingForm
            onSubmit={async () => {
              await refetch();
              setShowAddDialog(false);
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
