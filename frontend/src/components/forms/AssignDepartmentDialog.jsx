import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function AssignDepartmentDialog({ open, onClose, selectedStaff, newDepartment, setNewDepartment, handleDepartmentChange, departments }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    handleDepartmentChange(selectedStaff.id, newDepartment);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Department</DialogTitle>
        </DialogHeader>

        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div>
            <Label>Staff</Label>
            <input type="text" value={selectedStaff?.full_name || ''} disabled className="input-disabled w-full border rounded p-2" />
          </div>

          <div>
            <Label>Department</Label>
            <Select value={newDepartment} onValueChange={val => setNewDepartment(Number(val))}>
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

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Assign</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
