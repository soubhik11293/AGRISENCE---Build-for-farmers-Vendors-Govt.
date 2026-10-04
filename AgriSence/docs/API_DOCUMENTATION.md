# AgriSence Platform - API & Telemetry Documentation

This document describes the architectural data models, agronomic calculation engines, and reporting endpoints integrated into the AgriSence precision agriculture platform.

---

## 1. Agronomic Decision Engine & Telemetry Synthesis

### **Report Model: `DecisionReport`**
Synthesizes satellite vegetation indices, IoT capacitance sensors, soil testing chemistry, weather conditions, and APMC spot rates into an actionable daily field advisory.

```typescript
export interface DecisionReport {
  parcelId: number;
  parcelName: string;
  location: {
    village: string;
    district: string;
    state: string;
  };
  crop: {
    primaryCrop: string;
    areaAcres: number;
    growthStage: 'VE-V1' | 'V4-V6' | 'R1-R2' | 'R3-R5' | 'R7-R8';
  };
  compositeHealthScore: number; // 0 - 100 rating
  keyFindings: {
    ndviReflectance: number; // Sentinel-2 (0.0 to 1.0)
    rootMoisturePercent: number; // 0-20cm VWC%
    subsurfaceMoisturePercent: number; // 20-40cm VWC%
    soilPh: number;
    npkBalance: {
      nitrogenKgHa: number;
      phosphorusKgHa: number;
      potassiumKgHa: number;
    };
    mandiPriceRealization: {
      modalPricePerQtl: number;
      arbitrageSpread: number;
      benchmarkMarket: string;
    };
  };
  criticalDos: Array<{
    id: string;
    title: string;
    action: string;
    timing: string;
    priority: 'Mandatory' | 'Recommended';
  }>;
  criticalDonts: Array<{
    id: string;
    hazard: string;
    warning: string;
    riskTier: 'Severe' | 'Critical';
  }>;
}
```

---

## 2. Interactive Agronomic Simulator Specifications

### **A. Smart Spray Window & Drift Calendar (`spray-calendar`)**
* **Inputs:** Ambient Temperature (°C), Relative Humidity (%), 10m Wind Velocity (km/h), Precipitation Probability (%).
* **Logic:**
  * Wind $< 12 \text{ km/h}$ and Rain $< 20\%$ $\rightarrow$ **OPTIMAL** viability.
  * Wind $12\text{--}15 \text{ km/h}$ $\rightarrow$ **CAUTION** (drift hazard).
  * Wind $> 15 \text{ km/h}$ or Rain $> 40\%$ $\rightarrow$ **PROHIBITED** (high drift and wash-off).

### **B. Chemical Tank-Mix Compatibility (`tank-mix`)**
* **Inputs:** Product A formulation (e.g. Copper Oxychloride 50% WP, Mancozeb 75% WP, Boron 20%) + Product B formulation (e.g. Imidacloprid 17.8% SL, Wettable Sulfur 80% WDG).
* **Checks:**
  * Incompatible: Copper + Sulfur (phytotoxic flocculation).
  * Incompatible: Lime-sulfur + Organophosphates.
  * Caution: WP + EC (physical separation risk; requires pre-slurry jar test).
  * Protocol: Official W-A-L-E mixing sequence (Water $\rightarrow$ Agitation $\rightarrow$ Liquid/Powder $\rightarrow$ Emulsion).

### **C. Sell vs. Store Harvest Advisor (`sell-vs-store`)**
* **Parameters:**
  * Spot Mandi Price ($P_{\text{spot}}$ in ₹/qtl).
  * Projected Forward Price ($P_{\text{future}}$ in ₹/qtl) for 30, 60, or 90 days.
  * Warehouse storage rent: ₹36/qtl/month (WDRA standard).
  * e-NWR pledge loan interest subvention: 7.0% p.a. on 75% pledge value.
  * Moisture/transit shrinkage: 1.0% flat allowance.
* **Output:** Net Arbitrage Gain (₹) and recommendation: `STORE & HOLD` vs `SELL ON SPOT`.

### **D. Crop Phenology & Growth Stage Tracker (`crop-stages`)**
* **5 Phenological Stages:**
  1. `VE-V1`: Emergence & Early Seedling (Phosphorus primary uptake).
  2. `V4-V6`: Vegetative Canopy & Branching (Nitrogen vegetative demand).
  3. `R1-R2`: Peak Flowering & Pinhead Squaring (Water stress critical; Boron foliar).
  4. `R3-R5`: Pod & Grain Filling (Potassium translocation).
  5. `R7-R8`: Physiological Maturity & Harvest Prep (Irrigation cut-off).

### **E. Evapotranspiration ($ET_c$) Irrigation Controller (`smart-irrigation`)**
* **Formula:** $ET_c = ET_0 \times K_c$
  * $ET_0$: Reference evapotranspiration based on solar radiation and temperature.
  * $K_c$: Crop developmental coefficient (0.40 to 1.15).
  * Runtime (Hours) = $\frac{\text{Water Demand (Liters)}}{\text{Drip System Discharge (L/h)}}$.

---

## 3. Government Scheme & DBT Application Endpoints

All schemes provide direct integrations with official portals:
* **Central:** PM-KISAN (`https://pmkisan.gov.in`), PMFBY (`https://pmfby.gov.in`), PM-KUSUM (`https://pmkusum.mnre.gov.in`), Jan Samarth KCC (`https://www.jansamarth.in`).
* **States:**
  * Maharashtra: MahaDBT (`https://mahadbt.maharashtra.gov.in`), MSEDCL Solar (`https://www.mahadiscom.in/solar_MTSKPY/`).
  * Andhra Pradesh: YSR Rythu Bharosa (`https://ysrrythubharosa.ap.gov.in`).
  * Telangana: Rythu Bandhu (`https://rythubandhu.telangana.gov.in`).
  * Karnataka: FRUITS (`https://fruits.karnataka.gov.in`).
  * Tamil Nadu: TN AGRISNET (`https://www.tnagrisnet.tn.gov.in`).
  * Kerala: AIMS Portal (`https://www.aims.kerala.gov.in`).
  * Gujarat: i-Khedut (`https://ikhedut.gujarat.gov.in`).
  * Rajasthan: RajKisan Sathi (`https://rajkisan.rajasthan.gov.in`).
  * Madhya Pradesh: MP SAARA (`https://saara.mp.gov.in`).
  * Uttar Pradesh: UP Paradarshi Kisan Seva (`https://upagripardarshi.gov.in`).
  * Punjab: AgriPB CRM Subsidy (`https://agripb.gov.in`).
  * Haryana: Meri Fasal Mera Byora (`https://fasal.haryana.gov.in`).
  * West Bengal: Krishak Bandhu (`https://krishakbandhu.wb.gov.in`).
  * Odisha: KALIA (`https://kalia.odisha.gov.in`).
  * Bihar: Bihar DBT Agriculture (`https://dbtagriculture.bihar.gov.in`).
  * Assam: Directorate of Agriculture (`https://diragri.assam.gov.in`).
  * Himachal Pradesh: SPNF HP (`https://spnfhp.nic.in`).
  * Jammu & Kashmir: J&K HADP (`https://hadp.jk.gov.in`).

---

## 4. Authentication & Client-Side Session Schema

The `useAuth` hook replicates the Supabase auth session structure for seamless future backend integration:

```typescript
const { isAuthenticated, user, login, signup, logout } = useAuth();
```

* **Storage Key:** `agrisence_auth_session`
* **Free Tier Rules:** "AI Pest & Disease Detection" and "Outbreak Warning Radar" bypass authentication.
* **Protected Tier Rules:** Advanced agronomic simulators require authentication via `AuthGateModal`.
