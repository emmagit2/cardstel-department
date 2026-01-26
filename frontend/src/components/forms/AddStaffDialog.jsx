import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getDepartments } from '@/api/api_name';

const FIXED_ROLES = ["Staff", "Admin"];
const DEFAULT_POSITIONS = ["Officer", "Mail Officer", "Accountant", "Storekeeper"];

export default function InviteStaffDialog({ open, onClose, formData, setFormData, handleSubmit }) {
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [customPosition, setCustomPosition] = useState("");

  // Fetch departments from API
  useEffect(() => {
    if (open) {
      getDepartments()
        .then((data) => setDepartments(data))
        .catch(() => setDepartments([]));
    }
  }, [open]);

  const handleAddPosition = () => {
    if (customPosition.trim() && !positions.includes(customPosition)) {
      setPositions([...positions, customPosition]);
      setFormData({ ...formData, position: customPosition });
      setCustomPosition("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Staff</DialogTitle>
        </DialogHeader>

        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {/* Department (OPTIONAL) */}
          <div>
            <Label>Department (optional)</Label>
            <Select
              value={formData.department_id || ""}
              onValueChange={(val) => setFormData({ ...formData, department_id: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="(Optional) Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div>
            <Label>Role</Label>
            <Select
              value={formData.role}
              onValueChange={(val) => setFormData({ ...formData, role: val })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {FIXED_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div>
            <Label>Position</Label>
            <Select
              value={formData.position || ""}
              onValueChange={(val) => setFormData({ ...formData, position: val })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Add custom position */}
            <div className="flex gap-2 mt-2">
              <Input
                value={customPosition}
                onChange={(e) => setCustomPosition(e.target.value)}
                placeholder="Add new position"
              />
              <Button type="button" onClick={handleAddPosition}>
                Add
              </Button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Send Invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
