import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function EditStaffDialog({ open, onClose, formData, setFormData, handleUpdate, departments }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Staff</DialogTitle>
        </DialogHeader>

        <form className="space-y-4 mt-4" onSubmit={handleUpdate}>
          <div>
            <Label>Full Name</Label>
            <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
          </div>

          <div>
            <Label>Email</Label>
            <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>

          <div>
            <Label>Employee ID</Label>
            <Input value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} required />
          </div>

          <div>
            <Label>Role</Label>
            <Select value={formData.role} onValueChange={val => setFormData({...formData, role: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {['Admin','Manager','Operator','Accountant','Storekeeper','Supervisor'].map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Department</Label>
            <Select value={formData.department_id} onValueChange={val => setFormData({...formData, department_id: Number(val)})}>
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Position</Label>
            <Input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Update Staff</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
