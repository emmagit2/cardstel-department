import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function PurchaseForm({ onSubmit, onCancel, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    vendor: '',
    item_service_name: '',
    purchase_type: 'Goods',
    quantity: '',
    unit_price: '',
    payment_status: 'Pending',
    due_date: '',
    invoice_number: '',
    remarks: '',
  });

  const total = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.unit_price) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        unit_price: parseFloat(formData.unit_price) || 0,
        total_amount: total,
        purchase_date: new Date().toISOString().split('T')[0],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Vendor *</Label>
          <Input value={formData.vendor} onChange={(e) => setFormData({...formData, vendor: e.target.value})} required />
        </div>
        <div>
          <Label>Item/Service Name *</Label>
          <Input value={formData.item_service_name} onChange={(e) => setFormData({...formData, item_service_name: e.target.value})} required />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={formData.purchase_type} onValueChange={(v) => setFormData({...formData, purchase_type: v})}>
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
          <Label>Invoice Number</Label>
          <Input value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} />
        </div>
        <div>
          <Label>Quantity *</Label>
          <Input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required />
        </div>
        <div>
          <Label>Unit Price (₦) *</Label>
          <Input type="number" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: e.target.value})} required />
        </div>
        <div>
          <Label>Payment Status</Label>
          <Select value={formData.payment_status} onValueChange={(v) => setFormData({...formData, payment_status: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Due Date</Label>
          <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
        </div>
        <div className="col-span-2 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600">Total Amount: <span className="text-lg font-bold text-slate-900">₦{total.toLocaleString()}</span></p>
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