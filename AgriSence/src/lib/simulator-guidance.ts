import type { SimulationRecord } from '@/src/lib/simulator-sync';

export type ProcurementCategory = 'seeds' | 'crop_protection' | 'fertilizers' | 'machinery' | 'hyperlocal';
export type GuidancePriority = 'High' | 'Medium' | 'Low';

export interface ProcurementNeed {
  category: ProcurementCategory;
  query: string;
  reason: string;
  priority: GuidancePriority;
}

export interface SimulationGuidance {
  status: 'positive' | 'warning' | 'action' | 'review';
  summary: string;
  guidance: string[];
  procurementNeeds: ProcurementNeed[];
}

function asText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function firstText(...values: unknown[]) {
  return values.map((value) => asText(value)).find(Boolean) || '';
}

function buildNeeds(record: SimulationRecord): ProcurementNeed[] {
  const moduleId = record.moduleId.toLowerCase();
  const parameters = record.parameters || {};
  const metrics = record.calculatedMetrics || {};
  const crop = firstText(parameters.crop, parameters.targetCrop, 'selected crop');
  const needs: ProcurementNeed[] = [];

  if (moduleId.includes('tank-mix')) {
    const products = Array.isArray(parameters.selectedProductIds)
      ? parameters.selectedProductIds.slice(0, 3).join(', ')
      : 'recommended tank-mix products';
    needs.push({
      category: 'crop_protection',
      query: products,
      reason: 'Source the products used in the compatibility and dose plan.',
      priority: asText(metrics.overallStatus).toLowerCase().includes('incompat') ? 'High' : 'Medium',
    });
  } else if (moduleId.includes('pesticide') || moduleId.includes('spray-dosage')) {
    needs.push({
      category: 'crop_protection',
      query: firstText(parameters.selectedMoleculeId, 'crop protection products'),
      reason: `Procure the calibrated spray formulation for ${crop}.`,
      priority: 'High',
    });
  } else if (moduleId.includes('bio-control')) {
    needs.push({
      category: 'crop_protection',
      query: firstText(parameters.recipeName, parameters.recipeId, 'bio-control treatment'),
      reason: 'Prepare or procure the selected biological treatment before the application window.',
      priority: 'Medium',
    });
  } else if (moduleId.includes('soil')) {
    const deficit = asNumber(parameters.nitrogen) < 120 ? 'nitrogen fertilizer' : 'soil micronutrients and bio-fertilizer';
    needs.push({
      category: 'fertilizers',
      query: `${crop} ${deficit}`,
      reason: 'Match the soil analysis recommendation with crop-specific nutrition inputs.',
      priority: asNumber(parameters.soilEc) > 2.5 ? 'High' : 'Medium',
    });
  } else if (moduleId.includes('irrigation') || moduleId.includes('water-budget')) {
    needs.push({
      category: 'machinery',
      query: 'drip irrigation emitter filter and fertigation kit',
      reason: 'Use the calculated ETc demand to check delivery capacity and irrigation hardware.',
      priority: 'Medium',
    });
  } else if (moduleId.includes('crop-stages')) {
    needs.push({
      category: 'fertilizers',
      query: firstText(metrics.scheduledNutrientRecipe, `${crop} stage fertilizer`),
      reason: 'Prepare the nutrient split recommended for the current phenology stage.',
      priority: 'Medium',
    });
  } else if (moduleId.includes('crop-recommendation') || moduleId.includes('crop-compatibility') || moduleId.includes('intercropping') || moduleId.includes('companion')) {
    needs.push({
      category: 'seeds',
      query: firstText(parameters.intercropOption, parameters.mainCrop, 'companion crop seed'),
      reason: 'Source the selected companion or rotation crop for the recommended row geometry.',
      priority: 'Low',
    });
  } else if (moduleId.includes('sell-vs-store')) {
    const recommendation = asText(metrics.recommendation).toLowerCase();
    if (recommendation.includes('store')) {
      needs.push({
        category: 'machinery',
        query: `${crop} hermetic storage liner and moisture meter`,
        reason: 'Protect quality during the holding period recommended by the arbitrage result.',
        priority: 'Medium',
      });
    }
  }

  return needs;
}

export function buildSimulationGuidance(record: SimulationRecord): SimulationGuidance {
  const moduleId = record.moduleId.toLowerCase();
  const metrics = record.calculatedMetrics || {};
  const parameters = record.parameters || {};
  const moduleName = record.moduleName || record.moduleId;
  const recommendation = asText(metrics.recommendation);
  const overallStatus = asText(metrics.overallStatus).toLowerCase();
  const netProfit = asNumber(metrics.netProfit);
  const roi = asNumber(metrics.roi);
  const netGainPercent = asNumber(metrics.netGainPercent);
  const guidance: string[] = [];
  let status: SimulationGuidance['status'] = 'review';
  let summary = `${moduleName} completed. Review the calculated outputs before taking the field action.`;

  if (overallStatus.includes('incompat') || overallStatus.includes('unsafe') || overallStatus.includes('prohibited')) {
    status = 'warning';
    summary = `${moduleName} identified a compatibility or field-safety warning. Do not apply the current plan until it is corrected.`;
    guidance.push('Pause application and resolve every incompatible pair or prohibited weather condition first.');
  } else if (recommendation.toLowerCase().includes('sell today')) {
    status = 'action';
    summary = `${moduleName} recommends selling now because holding costs and expected shrinkage outweigh the projected recovery.`;
    guidance.push('Compare the current modal rate with the exit price and confirm transport before selling.');
  } else if (recommendation.toLowerCase().includes('store') || netGainPercent >= 8 || roi >= 20 || netProfit > 0) {
    status = 'positive';
    summary = `${moduleName} produced a positive modeled outcome. The selected plan is financially or agronomically favorable under the current inputs.`;
    guidance.push('Save the result to the selected parcel and convert the recommended next step into a field task.');
  } else {
    guidance.push('Review the assumptions and rerun after updating the latest weather, soil, crop, or market input.');
  }

  if (moduleId.includes('spray') || moduleId.includes('tank-mix')) {
    guidance.push('Recheck wind, rain probability, temperature, and label dose immediately before spraying.');
  } else if (moduleId.includes('soil')) {
    guidance.push(`Apply the nutrient plan in splits for ${firstText(parameters.targetCrop, parameters.crop, 'the selected crop')} and verify EC after fertigation.`);
  } else if (moduleId.includes('irrigation') || moduleId.includes('water-budget')) {
    guidance.push(`Use the calculated runtime as a starting point, then validate root-zone moisture after the irrigation cycle.`);
  } else if (moduleId.includes('crop-stages')) {
    guidance.push('Schedule the stage-specific nutrient and pest-monitoring actions before the next phenology window.');
  } else if (moduleId.includes('sell-vs-store')) {
    guidance.push(`Use the modeled exit price and breakeven price as thresholds; refresh the market feed before committing inventory.`);
  } else {
    guidance.push('Keep diagnosis, weather, and field observations synchronized so the next run becomes more precise.');
  }

  const needs = buildNeeds(record);
  if (needs.length > 0) {
    guidance.push(`Suggested procurement: ${needs.map((need) => need.query).join(' • ')}.`);
  }

  return { status, summary, guidance: guidance.slice(0, 4), procurementNeeds: needs };
}
