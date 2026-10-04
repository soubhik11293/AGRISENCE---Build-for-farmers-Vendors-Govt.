import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import type { Farm } from '@/src/types';

interface EditFarmFormProps {
  farm: Farm;
  onSave: (farm: Partial<Farm>) => Promise<void>;
  onCancel: () => void;
}

export function EditFarmForm({ farm, onSave, onCancel }: EditFarmFormProps) {
  const [form, setForm] = useState({
    name: farm.name,
    village: farm.village,
    district: farm.district,
    state: farm.state,
    pincode: farm.pincode || '',
    areaAcres: farm.areaAcres,
    primaryCrop: farm.primaryCrop,
    irrigationType: farm.irrigationType || '',
    soilType: farm.soilType || '',
    latitude: farm.latitude?.toString() || '',
    longitude: farm.longitude?.toString() || '',
    healthScore: farm.healthScore.toString(),
    moisturePercent: farm.moisturePercent.toString(),
    nitrogen: farm.nitrogen.toString(),
    phosphorus: farm.phosphorus.toString(),
    potassium: farm.potassium.toString(),
    phLevel: farm.phLevel.toString(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setValue = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: form.name.trim(),
        village: form.village.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        areaAcres: form.areaAcres.trim(),
        primaryCrop: form.primaryCrop.trim(),
        irrigationType: form.irrigationType.trim(),
        soilType: form.soilType.trim(),
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        healthScore: Number(form.healthScore),
        moisturePercent: Number(form.moisturePercent),
        nitrogen: Number(form.nitrogen),
        phosphorus: Number(form.phosphorus),
        potassium: Number(form.potassium),
        phLevel: Number(form.phLevel),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update this parcel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const field = (
    id: keyof typeof form,
    label: string,
    options: { type?: string; step?: string; required?: boolean } = {}
  ) => (
    <div>
      <Label htmlFor={`edit-${id}`} className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
        {label}
      </Label>
      <Input
        id={`edit-${id}`}
        type={options.type}
        step={options.step}
        required={options.required}
        value={form[id]}
        onChange={(event) => setValue(id, event.target.value)}
      />
    </div>
  );

  return (
    <form
      onSubmit={submit}
      className="rounded-[28px] border border-emerald-500/25 bg-white/80 p-5 shadow-lg backdrop-blur-xl dark:bg-slate-900/75"
    >
      <div className="mb-4 flex items-center justify-between border-b border-slate-200/70 pb-3 dark:border-white/10">
        <div>
          <h4 className="text-sm font-black text-slate-950 dark:text-white">Edit Farm Parcel</h4>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Update the saved field, crop, location and soil details.</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Close edit form">
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {field('name', 'Field / Parcel Name *', { required: true })}
        {field('primaryCrop', 'Primary Crop')}
        {field('areaAcres', 'Area (Acres)', { type: 'number', step: '0.1' })}
        {field('village', 'Village')}
        {field('district', 'District')}
        {field('state', 'State')}
        {field('pincode', 'Pincode')}
        {field('irrigationType', 'Irrigation Method')}
        {field('soilType', 'Soil Type / Horizon')}
        {field('latitude', 'Latitude', { type: 'number', step: 'any' })}
        {field('longitude', 'Longitude', { type: 'number', step: 'any' })}
        {field('healthScore', 'Farm Health Score', { type: 'number', step: '0.01' })}
        {field('moisturePercent', 'Moisture (%)', { type: 'number', step: '0.1' })}
        {field('nitrogen', 'Nitrogen (N)', { type: 'number', step: '0.1' })}
        {field('phosphorus', 'Phosphorus (P)', { type: 'number', step: '0.1' })}
        {field('potassium', 'Potassium (K)', { type: 'number', step: '0.1' })}
        {field('phLevel', 'Soil pH', { type: 'number', step: '0.1' })}
      </div>

      {error && <p className="mt-3 text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="mt-4 flex justify-end gap-2 border-t border-slate-200/70 pt-3 dark:border-white/10">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-2xl text-xs font-bold">
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="gap-1.5 rounded-2xl bg-[var(--brand-color,#0f9a58)] text-xs font-bold text-white hover:bg-[var(--brand-hover,#0d844b)]">
          <Save className="size-3.5" />
          {saving ? 'Saving Changes…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
