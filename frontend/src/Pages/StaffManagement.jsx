import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Edit,
  Building2,
  Trash
} from 'lucide-react';

// UI Components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import InviteStaffDialog from '../components/forms/AddStaffDialog';

// Shared components
import MetricCard from '../components/shared/MetricCard';
import FilterBar from '../components/shared/FilterBar';
import ExportButton from '../components/shared/ExportButton';

// API functions
import { inviteStaff, getStaff, getDepartments, updateStatus, updateDepartment, deleteStaff, updateStaff } from '@/api/api_name';

export default function StaffManagement() {
  const [filters, setFilters] = useState({});
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newDepartment, setNewDepartment] = useState(null);
  const [suspendData, setSuspendData] = useState({ months: 1, reason: '' });
  const [formData, setFormData] = useState({ name: '', email: '', position: '', role: '' });
  
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch staff and departments
  const { data: staff = [], isLoading, refetch } = useQuery({ queryKey: ['staff'], queryFn: getStaff });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });

  const getDepartmentName = id => {
    const dept = departments.find(d => d.id === id);
    return dept ? dept.name : 'N/A';
  };

  // Filter staff
  const filteredStaff = staff.filter(s => {
    if (filters.search &&
        !s.name?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !s.email?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !s.username?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.role && filters.role !== 'all' && s.role !== filters.role) return false;
    if (filters.department && filters.department !== 'all' && s.department_id !== Number(filters.department)) return false;
    if (filters.status && filters.status !== 'all' && s.status !== filters.status) return false;
    return true;
  });

  // Metrics
  const metrics = {
    total: staff.length,
    active: staff.filter(s => s.status === 'Active').length,
    suspended: staff.filter(s => s.status === 'Suspended').length,
    departments: [...new Set(staff.map(s => s.department_id))].length,
  };

  // Handlers
  const handleStatusChange = async (staffId, newStatus, months = 0, reason = '') => {
    try { await updateStatus(staffId, newStatus, months, reason); refetch(); } 
    catch(err) { console.error(err); alert('Error updating status'); }
  };

  const handleDepartmentChange = async (staffId, departmentId) => {
    try { await updateDepartment(staffId, departmentId); refetch(); } 
    catch(err) { console.error(err); alert('Error updating department'); }
  };

  const handleDelete = async staff => {
    if(!confirm(`Delete ${staff.name}? This cannot be undone.`)) return;
    try { await deleteStaff(staff.id); refetch(); } 
    catch(err) { console.error(err); alert('Error deleting staff'); }
  };

const openEditModal = staff => {
  setSelectedStaff(staff);
  setFormData({
    name: staff.name,
    email: staff.email,            // if your backend wants 'username', use email as username
    position: staff.position,
    role: staff.role,
    profile_picture: staff.profile_picture || ""
  });
  setShowEditDialog(true);
};


  const handleEditSave = async () => {
    try { 
      await updateStaff(selectedStaff.id, formData);
      refetch();
      setShowEditDialog(false);
      setSelectedStaff(null);
    } catch(err) {
      console.error(err);
      alert('Error updating staff');
    }
  };

  if(isLoading) return <div className="min-h-screen flex items-center justify-center">Loading staff...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <div className="flex gap-2">
          <ExportButton 
            data={filteredStaff} 
            filename="staff-list"
            columns={[
              { key:'name', label:'Name', accessor:r=>r.name },
              { key:'email', label:'Email', accessor:r=>r.email },
              { key:'created_at', label:'Joined Date', accessor:r=>new Date(r.created_at).toLocaleDateString() },
              { key:'role', label:'Role', accessor:r=>r.role },
              { key:'department', label:'Department', accessor:r=>getDepartmentName(r.department_id) },
              { key:'position', label:'Position', accessor:r=>r.position },
            ]}
          />
          <Button onClick={() => setShowAddDialog(true)}>
  <UserPlus className="w-4 h-4 mr-1"/>Add Staff
</Button>

        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard title="Total Staff" value={metrics.total} icon={Users}/>
        <MetricCard title="Active" value={metrics.active} icon={UserCheck}/>
        <MetricCard title="Suspended" value={metrics.suspended} icon={UserX}/>
        <MetricCard title="Departments" value={metrics.departments} icon={Building2}/>
      </div>

      {/* Filters */}
      <FilterBar 
        filters={[
          { key:'search', type:'search', placeholder:'Search staff...' },
          { key:'role', type:'select', label:'Role', placeholder:'Role', options:['Admin','Manager','Staff'].map(r=>({value:r,label:r})) },
          { key:'department', type:'select', label:'Department', placeholder:'Department', options:departments.map(d=>({value:d.id,label:d.name})) },
          { key:'status', type:'select', label:'Status', placeholder:'Status', options:['Active','Suspended'].map(s=>({value:s,label:s})) },
        ]}
        values={filters}
        onChange={setFilters}
        onReset={()=>setFilters({})}
      />

      {/* Staff Cards */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
  {filteredStaff.map(member => (
    <Card
      key={member.id}
      className="p-6 rounded-xl border bg-white shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start gap-4 min-w-0">
        
        {/* Avatar */}
        <img
          src={member.profile_picture || '/uploads/images/staff/unknown.jpg'}
          alt={member.name}
          className="w-16 h-16 rounded-full object-cover border shadow-sm shrink-0"
        />

        {/* Text */}
        <div className="flex-1 space-y-1 min-w-0">
          <h3 className="font-semibold text-[15px] leading-tight truncate max-w-[180px]">
            {member.name}
          </h3>

          <p className="text-sm text-slate-600 truncate max-w-[180px]">
            {member.email}
          </p>

          <div className="pt-2 space-y-1">
            <p className="text-xs text-slate-500">
              Joined: {new Date(member.created_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-slate-500 truncate max-w-[180px]">
              {getDepartmentName(member.department_id)}
            </p>
            <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-700 truncate max-w-[180px]">
              {member.position || "No Position"}
            </p>
          </div>
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full shrink-0"
            >
              •••
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => openEditModal(member)}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSelectedStaff(member);
              setShowSuspendDialog(true);
            }}>
              <UserX className="w-4 h-4 mr-2" /> Suspend
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'Active')}>
              <UserCheck className="w-4 h-4 mr-2" /> Activate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(member)}>
              <Trash className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              setSelectedStaff(member);
              setShowDeptDialog(true);
            }}>
              <Building2 className="w-4 h-4 mr-2" /> Assign Department
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  ))}
</div>


      {/* Edit Modal */}
      {showEditDialog && selectedStaff && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Edit {selectedStaff.name}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3 mt-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/>
              <Label>Email</Label>
              <Input value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})}/>
              <Label>Position</Label>
              <Input value={formData.position} onChange={e=>setFormData({...formData,position:e.target.value})}/>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={v=>setFormData({...formData,role:v})}>
                <SelectTrigger><SelectValue placeholder="Select Role"/></SelectTrigger>
                <SelectContent>{['Admin','Manager','Staff'].map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <Label>Profile Picture URL</Label>
<Input
  value={formData.profile_picture || ""}
  onChange={e => setFormData({ ...formData, profile_picture: e.target.value })}
  placeholder="Enter image URL"
/>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={()=>setShowEditDialog(false)}>Cancel</Button>
                <Button onClick={handleEditSave}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Department Modal */}
      {showDeptDialog && selectedStaff && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-md w-96">
            <h2 className="text-lg font-semibold mb-4">Assign Department</h2>
            <select className="w-full border p-2 rounded mb-4" value={newDepartment||''} onChange={e=>setNewDepartment(Number(e.target.value))}>
              <option value="">Select Department</option>
              {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>{setShowDeptDialog(false);setSelectedStaff(null)}}>Cancel</Button>
              <Button onClick={()=>{handleDepartmentChange(selectedStaff.id,newDepartment);setShowDeptDialog(false);setSelectedStaff(null)}}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
     {showSuspendDialog && selectedStaff && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white p-6 rounded-md w-96">
      <h2 className="text-lg font-semibold mb-4">Suspend {selectedStaff.name}</h2>

      {/* Suspension Duration Select */}
      <Select
        value={suspendData.duration}
        onValueChange={v => setSuspendData({ ...suspendData, duration: v, custom: '' })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Duration" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1_week">1 Week</SelectItem>
          <SelectItem value="2_weeks">2 Weeks</SelectItem>
          <SelectItem value="1_month">1 Month</SelectItem>
          <SelectItem value="3_months">3 Months</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Duration Input */}
      {suspendData.duration === 'custom' && (
        <Input
          type="text"
          placeholder="Enter duration (e.g., 10 days)"
          value={suspendData.custom}
          onChange={e => setSuspendData({ ...suspendData, custom: e.target.value })}
          className="mt-3"
        />
      )}

      {/* Reason */}
      <Textarea
        placeholder="Reason for suspension"
        value={suspendData.reason}
        onChange={e => setSuspendData({ ...suspendData, reason: e.target.value })}
        className="mt-3"
      />

      {/* Buttons */}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            // Convert duration to days
            let days;
            const map = {
              "1_week": 7,
              "2_weeks": 14,
              "1_month": 30,
              "3_months": 90,
            };
            if (suspendData.duration === 'custom') {
              // extract number from user input
              const match = suspendData.custom.match(/\d+/);
              days = match ? parseInt(match[0]) : 0;
            } else {
              days = map[suspendData.duration];
            }

            handleStatusChange(
              selectedStaff.id,
              'Suspended',
              days,
              suspendData.reason
            );
            setShowSuspendDialog(false);
          }}
        >
          Suspend
        </Button>
      </div>
    </div>
  </div>
)}
<InviteStaffDialog
  open={showAddDialog}
  onClose={() => setShowAddDialog(false)}
  formData={formData}
  setFormData={setFormData}
  handleSubmit={async (e) => {
    e.preventDefault();

    try {
      // Call the inviteStaff API
      const res = await inviteStaff(formData);
      console.log('Invite API response:', res);

      // Show a success message
      alert(`Invitation sent to ${formData.email}`);

      // Close modal and reset form
      setShowAddDialog(false);
      setFormData({ email: '', role: '', department_id: null, position: '' });

      // Optional: refetch staff list if you have a function
      if (typeof refetch === 'function') refetch();
    } catch (err) {
      console.error('Invite failed:', err);
      alert('Failed to send invitation. Please try again.');
    }
  }}
/>


    </div>
  );
}
