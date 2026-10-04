import React, { useState } from 'react';
import { LocateFixed, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import type { Farm } from '@/src/types';
import { useLanguage } from '@/src/context/language-context';

export function AddFarmForm({ onAddFarm }: { onAddFarm: (farm: Partial<Farm>) => Promise<void> }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [village, setVillage] = useState('Shirur');
  const [district, setDistrict] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [areaAcres, setAreaAcres] = useState('4.2');
  const [primaryCrop, setPrimaryCrop] = useState('Soybean');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [irrigationType, setIrrigationType] = useState('Drip');
  const [soilType, setSoilType] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [gpsMessage, setGpsMessage] = useState('');

  const captureCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error');
      setGpsMessage('GPS location is not supported by this browser. You can enter the coordinates manually.');
      return;
    }

    setGpsStatus('loading');
    setGpsMessage('Requesting your current GPS location…');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lon.toFixed(6));
        setGpsStatus('success');
        setGpsMessage(`GPS location captured with approximately ${Math.round(position.coords.accuracy)} m accuracy.`);

        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );
          if (!response.ok) return;
          const location = await response.json();
          const administrative = Array.isArray(location.localityInfo?.administrative)
            ? location.localityInfo.administrative
            : [];
          const districtEntry = administrative.find((entry: { name?: string; description?: string }) =>
            /district/i.test(`${entry.description || ''} ${entry.name || ''}`)
          );
          const detectedVillage = location.locality || location.city || '';
          const detectedDistrict = districtEntry?.name || location.city || '';
          const detectedState = location.principalSubdivision || '';
          const detectedPincode = location.postcode || '';

          if (detectedVillage) setVillage(detectedVillage);
          if (detectedDistrict) setDistrict(detectedDistrict);
          if (detectedState) setState(detectedState);
          if (detectedPincode) setPincode(detectedPincode);
          if (detectedVillage || detectedDistrict || detectedState) {
            setGpsMessage(`GPS synced: ${[detectedVillage, detectedDistrict, detectedState].filter(Boolean).join(', ')}`);
          }
        } catch {
          // Coordinates remain valid even if the optional place-name lookup is unavailable.
        }
      },
      (locationError) => {
        const message = locationError.code === locationError.PERMISSION_DENIED
          ? 'Location permission was denied. Allow location access and try again, or enter it manually.'
          : locationError.code === locationError.TIMEOUT
            ? 'GPS detection timed out. Move near an open area and try again.'
            : 'Your current GPS position is unavailable. Try again or enter it manually.';
        setGpsStatus('error');
        setGpsMessage(message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    try {
      await onAddFarm({
        name: name.trim(),
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        areaAcres: areaAcres.trim(),
        primaryCrop: primaryCrop.trim(),
        pincode: pincode.trim(),
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        irrigationType: irrigationType.trim(),
        soilType: soilType.trim(),
        healthScore: 0.78,
        moisturePercent: 28.5,
        nitrogen: 140,
        phosphorus: 22,
        potassium: 260,
        phLevel: 7.2,
      });
      setName('');
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to save parcel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => {
          setOpen(true);
          captureCurrentLocation();
        }}
        className="rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white shadow-xs font-bold text-xs gap-1.5 cursor-pointer"
      >
        <Plus className="size-4" />
        <span>{t('dash.addParcel', 'Add Parcel')}</span>
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 rounded-[28px] frosted-card border border-white/80 dark:border-white/12 shadow-2xl space-y-4 text-slate-950 dark:text-slate-100"
    >
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
        <h4 className="font-black text-sm text-slate-950 dark:text-white">Add New Cultivation Parcel</h4>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className={`flex flex-col gap-2 rounded-2xl border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between ${
        gpsStatus === 'error'
          ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-emerald-500/25 bg-emerald-500/10'
      }`}>
        <div className="flex min-w-0 items-center gap-2">
          {gpsStatus === 'loading'
            ? <Loader2 className="size-4 shrink-0 animate-spin text-[var(--brand-color,#0f9a58)]" />
            : <LocateFixed className="size-4 shrink-0 text-[var(--brand-color,#0f9a58)]" />}
          <div>
            <p className="text-[11px] font-black text-slate-900 dark:text-white">Current parcel location</p>
            <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
              {gpsMessage || 'Use device GPS to fill this parcel’s coordinates and nearby address.'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={gpsStatus === 'loading'}
          onClick={captureCurrentLocation}
          className="h-8 shrink-0 rounded-xl px-3 text-[10px] font-black"
        >
          {gpsStatus === 'loading' ? 'Locating…' : gpsStatus === 'success' ? 'Refresh GPS' : 'Use Current GPS'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="sm:col-span-2">
          <Label htmlFor="name" className="text-slate-800 dark:text-slate-200 font-black mb-1 block">Field / Parcel Name *</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. North Plot - Riverbed"
          />
        </div>

        <div>
          <Label htmlFor="village" className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">Village</Label>
          <Input
            id="village"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="Village name"
          />
        </div>

        <div>
          <Label htmlFor="district" className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">District</Label>
          <Input
            id="district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="District"
          />
        </div>

        <div>
          <Label htmlFor="state" className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">State</Label>
          <Input
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
          />
        </div>

        <div>
          <Label htmlFor="area" className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">Area (Acres)</Label>
          <Input
            id="area"
            type="number"
            step="0.1"
            value={areaAcres}
            onChange={(e) => setAreaAcres(e.target.value)}
            placeholder="3.5"
          />
        </div>

        <div>
          <Label htmlFor="pincode" className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">Pincode</Label>
          <Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="411001" />
        </div>

        <div>
          <Label htmlFor="irrigation" className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">Irrigation Method</Label>
          <select id="irrigation" value={irrigationType} onChange={(e) => setIrrigationType(e.target.value)} className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 text-xs font-bold bg-transparent">
            <option>Drip</option><option>Sprinkler</option><option>Flood / Furrow</option><option>Rainfed</option><option>Fertigation</option><option>Other</option>
          </select>
        </div>

        <div>
          <Label htmlFor="latitude" className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">Latitude (optional)</Label>
          <Input id="latitude" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="18.5204" />
        </div>

        <div>
          <Label htmlFor="longitude" className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">Longitude (optional)</Label>
          <Input id="longitude" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="73.8567" />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="soilType" className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">Soil Type / Horizon</Label>
          <Input id="soilType" value={soilType} onChange={(e) => setSoilType(e.target.value)} placeholder="e.g. Deep Black Cotton Clay / Vertisol" />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="crop" className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">Primary Crop</Label>
          <Input
            id="crop"
            value={primaryCrop}
            onChange={(e) => setPrimaryCrop(e.target.value)}
            placeholder="e.g. Soybean, Cotton, Wheat"
          />
        </div>
      </div>

      {error && <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          className="rounded-2xl text-xs font-bold cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          {saving ? 'Saving Parcel…' : 'Save Parcel'}
        </Button>
      </div>
    </form>
  );
}
