import React from 'react';
import { Activity, CalendarDays, Droplets, FlaskConical, Gauge, Leaf, MapPin, ShieldAlert, Sprout, Thermometer, TrendingUp, Waves } from 'lucide-react';
import { ExpandableIntelligenceCard } from '@/src/components/dashboard/expandable-intelligence-card';
import { useFarms } from '@/src/context/farm-context';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useLanguage } from '@/src/context/language-context';

export function FieldIntelligenceGrid() {
  const { t } = useLanguage();
  const { selectedFarm, selectedCropCycle } = useFarms();
  const { weatherData, outbreakData, rotatingMarketItem, sprayStatusForNow } = useTelemetry();
  const { activeDiagnosis, diagnosisHistory } = useDiagnosis();
  if (!selectedFarm) return null;

  const cells = [
    ['Parcel', selectedFarm.name, [MapPin, [selectedFarm.village, selectedFarm.district, selectedFarm.state].filter(Boolean).join(', ')]],
    ['Crop cycle', selectedCropCycle?.crop || selectedFarm.primaryCrop, [Sprout, selectedCropCycle?.currentStage || 'Active cycle']],
    ['Area', `${selectedFarm.areaAcres} acres`, [Leaf, selectedFarm.soilType || 'Soil profile not specified']],
    ['Canopy vigor', `${(selectedFarm.healthScore * 100).toFixed(0)}%`, [Activity, 'Current farm health score']],
    ['Root moisture', `${selectedFarm.moisturePercent}%`, [Droplets, `N ${selectedFarm.nitrogen} • P ${selectedFarm.phosphorus} • K ${selectedFarm.potassium}`]],
    ['Soil reaction', `pH ${selectedFarm.phLevel}`, [Gauge, selectedFarm.irrigationType || 'Irrigation method not specified']],
    ['Microclimate', `${weatherData.temp}°C • ${weatherData.humidity}% RH`, [Thermometer, `Wind ${weatherData.windSpeed} km/h • VPD ${weatherData.vpd} kPa`]],
    ['Water demand', `${weatherData.et0} mm/day ET₀`, [Waves, `Rain probability ${weatherData.rainProb}%`]],
    ['Spray window', sprayStatusForNow, [FlaskConical, `Wind ${weatherData.windSpeed} km/h`]],
    ['Pest status', activeDiagnosis?.pestName || 'No active diagnosis', [ShieldAlert, activeDiagnosis ? `${activeDiagnosis.severity} • ${activeDiagnosis.confidence}% confidence` : `${diagnosisHistory.length} historical diagnoses`]],
    ['Outbreak', `${outbreakData.hazardLevel} risk`, [ShieldAlert, outbreakData.predictedPathogens[0] || 'No predicted pathogen']],
    ['Market', `₹${(rotatingMarketItem?.modalPrice || 0).toLocaleString('en-IN')}/qtl`, [TrendingUp, `${rotatingMarketItem?.commodity || 'Configured commodity'} • ${rotatingMarketItem?.market || 'Market dataset'}`]],
    ['Crop calendar', selectedCropCycle?.sowingDate ? `Sown ${new Date(selectedCropCycle.sowingDate).toLocaleDateString('en-IN')}` : 'Sowing date not set', [CalendarDays, selectedCropCycle?.expectedHarvestDate ? `Harvest ${new Date(selectedCropCycle.expectedHarvestDate).toLocaleDateString('en-IN')}` : 'Harvest date not set']],
  ] as const;

  const cellLabelKeys: Record<string, string> = {
    'Crop cycle': 'command.cropCycle',
    Area: 'command.area',
    'Canopy vigor': 'dash.kpi.ndvi',
    'Root moisture': 'dash.kpi.moisture',
    'Soil reaction': 'dash.kpi.ph',
    Microclimate: 'command.microclimate',
    'Water demand': 'command.waterDemand',
    'Spray window': 'command.sprayWindow',
    'Pest status': 'command.pestStatus',
    Outbreak: 'command.outbreak',
    Market: 'command.market',
    'Crop calendar': 'command.cropCalendar',
  };

  return (
    <section className="p-5 sm:p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
      <div>
        <div className="text-[10px] font-black uppercase tracking-wider text-[var(--brand-text,#0d7342)]">{t('command.snapshotEyebrow', 'Complete field snapshot')}</div>
        <h2 className="text-xl font-black text-slate-950 dark:text-white mt-1">{t('command.snapshotTitle', 'Everything currently known for this parcel')}</h2>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">{t('command.snapshotDesc', 'A consolidated operational view; individual modules remain the source for detailed calculations and actions.')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {cells.map(([label, value, detail]) => {
          const Icon = detail[0];
          const detailText = String(detail[1]);
          const related: Record<string, string[]> = {
            Parcel: [selectedFarm.village, selectedFarm.district, selectedFarm.state, `${selectedFarm.areaAcres} acres`].filter(Boolean),
            'Crop cycle': [selectedCropCycle?.variety || 'Variety not set', selectedCropCycle?.season || 'Season not set', selectedCropCycle?.status || 'Status not set', selectedCropCycle?.currentStage || 'Stage not set'],
            Area: [`Soil: ${selectedFarm.soilType || 'Not specified'}`, `pH ${selectedFarm.phLevel}`, `Irrigation: ${selectedFarm.irrigationType || 'Not specified'}`, `N ${selectedFarm.nitrogen} • P ${selectedFarm.phosphorus} • K ${selectedFarm.potassium}`],
            'Canopy vigor': [`Health score ${selectedFarm.healthScore}/1.0`, `NDVI-linked dashboard score`, `Crop: ${selectedCropCycle?.crop || selectedFarm.primaryCrop}`, `Historical diagnoses: ${diagnosisHistory.length}`],
            'Root moisture': [`Moisture ${selectedFarm.moisturePercent}%`, `N ${selectedFarm.nitrogen}`, `P ${selectedFarm.phosphorus}`, `K ${selectedFarm.potassium}`],
            'Soil reaction': [`pH ${selectedFarm.phLevel}`, `Soil: ${selectedFarm.soilType || 'Not specified'}`, `Irrigation: ${selectedFarm.irrigationType || 'Not specified'}`, `Moisture ${selectedFarm.moisturePercent}%`],
            Microclimate: [`Temperature ${weatherData.temp}°C`, `Humidity ${weatherData.humidity}%`, `Wind ${weatherData.windSpeed} km/h`, `VPD ${weatherData.vpd} kPa`],
            'Water demand': [`ET₀ ${weatherData.et0} mm/day`, `Rain probability ${weatherData.rainProb}%`, `Moisture ${selectedFarm.moisturePercent}%`, `Irrigation ${selectedFarm.irrigationType || 'Not specified'}`],
            'Spray window': [`Status: ${sprayStatusForNow}`, `Wind ${weatherData.windSpeed} km/h`, `Humidity ${weatherData.humidity}%`, `Rain probability ${weatherData.rainProb}%`],
            'Pest status': [activeDiagnosis?.pestName || 'No active diagnosis', activeDiagnosis ? `Severity ${activeDiagnosis.severity}` : `${diagnosisHistory.length} historical observations`, activeDiagnosis ? `Confidence ${activeDiagnosis.confidence}%` : 'Awaiting observation', activeDiagnosis?.affectedCrop || selectedCropCycle?.crop || selectedFarm.primaryCrop],
            Outbreak: [`Hazard ${outbreakData.hazardLevel}`, outbreakData.predictedPathogens[0] || 'No predicted pathogen', `Quarantine ${outbreakData.quarantineRadiusMeters}m`, `Farm: ${selectedFarm.name}`],
            Market: [`Commodity ${rotatingMarketItem?.commodity || 'Configured commodity'}`, `Market ${rotatingMarketItem?.market || 'Dataset'}`, `Modal ₹${(rotatingMarketItem?.modalPrice || 0).toLocaleString('en-IN')}/qtl`, `Spread ₹${(rotatingMarketItem?.arbitrageSpread || 0).toLocaleString('en-IN')}/qtl`],
            'Crop calendar': [`Sowing ${selectedCropCycle?.sowingDate ? new Date(selectedCropCycle.sowingDate).toLocaleDateString('en-IN') : 'Not set'}`, `Expected harvest ${selectedCropCycle?.expectedHarvestDate ? new Date(selectedCropCycle.expectedHarvestDate).toLocaleDateString('en-IN') : 'Not set'}`, `Stage ${selectedCropCycle?.currentStage || 'Not set'}`, `Status ${selectedCropCycle?.status || 'Not set'}`],
          };
          return <ExpandableIntelligenceCard key={label} label={t(cellLabelKeys[label] || '', label)} value={String(value)} subtitle={detailText} icon={Icon} details={(related[label] || [detailText]).map((item, index) => ({ label: index === 0 ? 'Connected value' : `Related ${index + 1}`, value: item }))} />;
        })}
      </div>
    </section>
  );
}
