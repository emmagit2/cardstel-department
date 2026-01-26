import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function PurchaseRequestForm({ onSubmit, onCancel, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    description: '',
    item_service_name: '',
    request_type: 'Goods',
    requested_quantity: '',
    requested_amount: '',
    requester_name: '',
    department: '',
    approval_status: 'Pending',
    remarks: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        requested_quantity: parseFloat(formData.requested_quantity) || 0,
        requested_amount: parseFloat(formData.requested_amount) || 0,
        request_date: new Date().toISOString().split('T')[0],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Description *</Label>
          <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
        </div>
        <div>
          <Label>Item/Service Name *</Label>
          <Input value={formData.item_service_name} onChange={(e) => setFormData({...formData, item_service_name: e.target.value})} required />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={formData.request_type} onValueChange={(v) => setFormData({...formData, request_type: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Goods">Goods</SelectItem>
              <SelectItem value="Services">Services</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Requested Quantity *</Label>
          <Input type="number" value={formData.requested_quantity} onChange={(e) => setFormData({...formData, requested_quantity: e.target.value})} required />
        </div>
        <div>
          <Label>Requested Amount (₦) *</Label>
          <Input type="number" value={formData.requested_amount} onChange={(e) => setFormData({...formData, requested_amount: e.target.value})} required />
        </div>
        <div>
          <Label>Requester Name</Label>
          <Input value={formData.requester_name} onChange={(e) => setFormData({...formData, requester_name: e.target.value})} />
        </div>
        <div>
          <Label>Department</Label>
          <Select value={formData.department} onValueChange={(v) => setFormData({...formData, department: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Production">Production</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Store">Store</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
            </SelectContent>
          </Select>
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