import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// API functions
import { fetchMachineOperators, fetchMachines, createEmbedding } from "@/api/api_name";

export default function EmbeddingForm({ onSubmit, onCancel, initialData = null }) {
  const safeInitial = initialData || {};

  // --------------------
  // Form state
  // --------------------
  const [formData, setFormData] = useState({
    operator_id: safeInitial.operator_id || '',
    machine_id: safeInitial.machine_id || '',
    quantity_received: safeInitial.quantity_received || '',
    good_quantity: safeInitial.good_quantity || '',
    quantity_embedded: safeInitial.quantity_embedded || '',
    quantity_rejected: safeInitial.quantity_rejected || '',
    quantity_returned: safeInitial.quantity_returned || '',
    shift: safeInitial.shift || '',
    start_time: safeInitial.start_time || '',
    remarks: safeInitial.remarks || '',
  });

  // --------------------
  // State
  // --------------------
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState([]);
  const [machines, setMachines] = useState([]);
  const [errors, setErrors] = useState({});

  // --------------------
  // Fetch + NORMALIZE
  // --------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const ops = await fetchMachineOperators();
        const macs = await fetchMachines();

        setOperators(ops.map(op => ({ id: String(op.id), name: op.name })));
        setMachines(macs.map(m => ({ id: String(m.device_id), name: m.device_name })));
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  // --------------------
  // Validation
  // --------------------
  const validate = () => {
    const errs = {};
    if (!formData.operator_id) errs.operator_id = "Operator is required";
    if (!formData.machine_id) errs.machine_id = "Machine is required";
    if (!formData.quantity_received || Number(formData.quantity_received) < 0) errs.quantity_received = "Quantity received must be ≥ 0";
    return errs;
  };

  // --------------------
  // Submit
  // --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const payload = {
      operator_id: Number(formData.operator_id),
      device_id: Number(formData.machine_id),
      quantity_received: Number(formData.quantity_received) || 0,
      good_quantity: Number(formData.good_quantity) || 0,
      quantity_embedded: Number(formData.quantity_embedded) || 0,
      quantity_rejected: Number(formData.quantity_rejected) || 0,
      quantity_returned: Number(formData.quantity_returned) || 0,
      shift: formData.shift || null,
      start_time: formData.start_time || null,
      remarks: formData.remarks || null,
    };

    console.log("SUBMIT PAYLOAD:", payload);

    try {
      await createEmbedding(payload);
      onSubmit && onSubmit();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --------------------
  // UI
  // --------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Operator */}
        <div>
          <Label>Operator *</Label>
          <Select
            value={formData.operator_id}
            onValueChange={(v) => setFormData({ ...formData, operator_id: v })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {operators.map(op => <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.operator_id && <p className="text-red-500 text-sm mt-1">{errors.operator_id}</p>}
        </div>

        {/* Machine */}
        <div>
          <Label>Machine *</Label>
          <Select
            value={formData.machine_id}
            onValueChange={(v) => setFormData({ ...formData, machine_id: v })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select machine" />
            </SelectTrigger>
            <SelectContent>
              {machines.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.machine_id && <p className="text-red-500 text-sm mt-1">{errors.machine_id}</p>}
        </div>

        {/* Quantity Received */}
        <div>
          <Label>Quantity Received *</Label>
          <Input
            type="number"
            value={formData.quantity_received}
            onChange={(e) => setFormData({ ...formData, quantity_received: e.target.value })}
            required
          />
          {errors.quantity_received && <p className="text-red-500 text-sm mt-1">{errors.quantity_received}</p>}
        </div>

        {/* Other quantities */}
        <div>
          <Label>Good Quantity</Label>
          <Input type="number" value={formData.good_quantity} onChange={(e) => setFormData({ ...formData, good_quantity: e.target.value })} />
        </div>
        <div>
          <Label>Quantity Embedded</Label>
          <Input type="number" value={formData.quantity_embedded} onChange={(e) => setFormData({ ...formData, quantity_embedded: e.target.value })} />
        </div>
        <div>
          <Label>Quantity Rejected</Label>
          <Input type="number" value={formData.quantity_rejected} onChange={(e) => setFormData({ ...formData, quantity_rejected: e.target.value })} />
        </div>
        <div>
          <Label>Quantity Returned</Label>
          <Input type="number" value={formData.quantity_returned} onChange={(e) => setFormData({ ...formData, quantity_returned: e.target.value })} />
        </div>

        {/* Shift */}
        <div>
          <Label>Shift</Label>
          <Select value={formData.shift} onValueChange={(v) => setFormData({ ...formData, shift: v })}>
            <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Morning">Morning</SelectItem>
              <SelectItem value="Afternoon">Afternoon</SelectItem>
              <SelectItem value="Night">Night</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start time */}
        <div className="col-span-2">
          <Label>Start Time</Label>
          <Input type="datetime-local" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
        </div>
      </div>

      {/* Remarks */}
      <div>
        <Label>Remarks</Label>
        <Textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} rows={2} />
      </div>

      {/* Buttons */}
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
