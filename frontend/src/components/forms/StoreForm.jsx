import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function StoreForm({ onSubmit, onCancel, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    item_name: '',
    quantity_received: '',
    quantity_requested: '',
    vendor: '',
    category: '',
    unit_price: '',
    storekeeper: '',
    remarks: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        quantity_received: parseFloat(formData.quantity_received) || 0,
        quantity_requested: parseFloat(formData.quantity_requested) || 0,
        unit_price: parseFloat(formData.unit_price) || 0,
        time_received: new Date().toISOString(),
        is_confirmed: false,
        seen_by: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Item Name *</Label>
          <Input value={formData.item_name} onChange={(e) => setFormData({...formData, item_name: e.target.value})} required />
        </div>
        <div>
          <Label>Vendor *</Label>
          <Input value={formData.vendor} onChange={(e) => setFormData({...formData, vendor: e.target.value})} required />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Raw Materials">Raw Materials</SelectItem>
              <SelectItem value="Office Supplies">Office Supplies</SelectItem>
              <SelectItem value="Equipment">Equipment</SelectItem>
              <SelectItem value="Consumables">Consumables</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Storekeeper</Label>
          <Input value={formData.storekeeper} onChange={(e) => setFormData({...formData, storekeeper: e.target.value})} />
        </div>
        <div>
          <Label>Quantity Requested</Label>
          <Input type="number" value={formData.quantity_requested} onChange={(e) => setFormData({...formData, quantity_requested: e.target.value})} />
        </div>
        <div>
          <Label>Quantity Received *</Label>
          <Input type="number" value={formData.quantity_received} onChange={(e) => setFormData({...formData, quantity_received: e.target.value})} required />
        </div>
        <div className="col-span-2">
          <Label>Unit Price (₦)</Label>
          <Input type="number" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: e.target.value})} />
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