import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function TelcomForm({ onSubmit, onCancel, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    telecom_brand: '',
    quantity_received: '',
    quantity_packed: '',
    quantity_wip: '',
    quantity_reconciled: '',
    quantity_returned: '',
    operator_name: '',
    machine_used: '',
    shift: '',
    status: 'Pending',
    start_time: '',
    remarks: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        quantity_received: parseFloat(formData.quantity_received) || 0,
        quantity_packed: parseFloat(formData.quantity_packed) || 0,
        quantity_wip: parseFloat(formData.quantity_wip) || 0,
        quantity_reconciled: parseFloat(formData.quantity_reconciled) || 0,
        quantity_returned: parseFloat(formData.quantity_returned) || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Telecom Brand *</Label>
          <Select value={formData.telecom_brand} onValueChange={(v) => setFormData({...formData, telecom_brand: v})} required>
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Glo">Glo</SelectItem>
              <SelectItem value="Airtel">Airtel</SelectItem>
              <SelectItem value="MTN">MTN</SelectItem>
              <SelectItem value="9mobile">9mobile</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Operator Name *</Label>
          <Input value={formData.operator_name} onChange={(e) => setFormData({...formData, operator_name: e.target.value})} required />
        </div>
        <div>
          <Label>Machine Used</Label>
          <Input value={formData.machine_used} onChange={(e) => setFormData({...formData, machine_used: e.target.value})} />
        </div>
        <div>
          <Label>Shift</Label>
          <Select value={formData.shift} onValueChange={(v) => setFormData({...formData, shift: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Morning">Morning</SelectItem>
              <SelectItem value="Afternoon">Afternoon</SelectItem>
              <SelectItem value="Night">Night</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Quantity Received *</Label>
          <Input type="number" value={formData.quantity_received} onChange={(e) => setFormData({...formData, quantity_received: e.target.value})} required />
        </div>
        <div>
          <Label>Quantity Packed</Label>
          <Input type="number" value={formData.quantity_packed} onChange={(e) => setFormData({...formData, quantity_packed: e.target.value})} />
        </div>
        <div>
          <Label>WIP</Label>
          <Input type="number" value={formData.quantity_wip} onChange={(e) => setFormData({...formData, quantity_wip: e.target.value})} />
        </div>
        <div>
          <Label>Reconciled</Label>
          <Input type="number" value={formData.quantity_reconciled} onChange={(e) => setFormData({...formData, quantity_reconciled: e.target.value})} />
        </div>
        <div>
          <Label>Returned</Label>
          <Input type="number" value={formData.quantity_returned} onChange={(e) => setFormData({...formData, quantity_returned: e.target.value})} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Malating ongoing">Malating ongoing</SelectItem>
              <SelectItem value="Fully packed">Fully packed</SelectItem>
              <SelectItem value="Reconciled">Reconciled</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Start Time</Label>
          <Input type="datetime-local" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} />
        </div>
      </div>
      <div>
        <Label>Remarks</Label>
        <Textarea value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} rows={2} />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}