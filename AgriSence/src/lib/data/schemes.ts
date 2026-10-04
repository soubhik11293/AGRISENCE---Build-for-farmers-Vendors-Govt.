import type { Scheme } from '@/src/types';

export const schemeCategories = [
  'Income Support',
  'Crop Insurance',
  'Solar & Energy',
  'Credit & Finance',
  'Irrigation & Water',
  'Farm Mechanization',
  'Organic & Bio-Inputs',
  'Horticulture & Seeds',
] as const;

export const allIndianStates = [
  'All States',
  'Central Schemes',
  'Maharashtra',
  'Andhra Pradesh',
  'Telangana',
  'Karnataka',
  'Tamil Nadu',
  'Kerala',
  'Gujarat',
  'Rajasthan',
  'Madhya Pradesh',
  'Uttar Pradesh',
  'Punjab',
  'Haryana',
  'West Bengal',
  'Odisha',
  'Bihar',
  'Assam',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Chhattisgarh',
  'Jharkhand',
  'Uttarakhand',
  'Goa',
  'Tripura',
  'Meghalaya',
  'Manipur',
  'Nagaland',
  'Mizoram',
  'Sikkim',
  'Arunachal Pradesh',
  'Ladakh',
  'Delhi',
  'Puducherry',
] as const;

export const schemes: Scheme[] = [
  // --- Central Schemes ---
  {
    id: 'pm-kisan',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    hindiName: 'प्रधानमंत्री किसान सम्मान निधि योजना',
    state: 'Central Schemes',
    category: 'Income Support',
    type: 'Central',
    shortDescription:
      'Direct income support of ₹6,000 per year in three equal 4-monthly installments of ₹2,000 directly transferred into bank accounts of all landholding farmer families.',
    benefit: '₹6,000 / year via DBT (3 installments of ₹2,000 each)',
    eligibility: [
      'All landholding farmer families with cultivable landholding in their names',
      'Valid Aadhaar linked with active bank account and e-KYC completed',
      'Excludes institutional landholders and constitutional post holders',
    ],
    officialUrl: 'https://pmkisan.gov.in',
    portalName: 'PM-KISAN Official DBT Portal',
    helpline: '155261 / 011-24300606',
    applicationDeadline: 'Continuous enrollment throughout year',
  },
  {
    id: 'pmfby',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    hindiName: 'प्रधानमंत्री फसल बीमा योजना',
    state: 'Central Schemes',
    category: 'Crop Insurance',
    type: 'Insurance',
    shortDescription:
      'Comprehensive safety net against non-preventable natural risks (drought, flood, hailstorm, localized pests) with low farmer premium: 2% for Kharif, 1.5% for Rabi, and 5% for annual horticultural crops.',
    benefit: 'Full sum insured coverage with localized 72-hour loss intimation mechanism',
    eligibility: [
      'All farmers growing notified crops in notified areas (loanee and non-loanee)',
      'Sharecroppers and tenant farmers with sowing certificates eligible',
      'Must intimate crop loss within 72 hours via Crop Insurance App',
    ],
    officialUrl: 'https://pmfby.gov.in',
    portalName: 'National Crop Insurance Portal (NCIP)',
    helpline: '14447 (Kisan Call Centre)',
    applicationDeadline: 'Kharif: 31 July | Rabi: 31 December',
  },
  {
    id: 'pm-kusum',
    name: 'PM-KUSUM Solar Agriculture Pump Scheme',
    hindiName: 'पीएम-कुसुम सौर कृषि पंप योजना',
    state: 'Central Schemes',
    category: 'Solar & Energy',
    type: 'Subsidy',
    shortDescription:
      'Provides 60% capital subsidy (30% Central + 30% State) for standalone off-grid solar agricultural pumps (3HP to 10HP) and solarization of existing grid-connected tube wells.',
    benefit: 'Up to 60% capital subsidy on DC/AC solar water pumping systems',
    eligibility: [
      'Individual farmers, Water User Associations, FPOs and Panchayats',
      'Land title with valid water extraction source (borewell/open well)',
      'Farmer contributes only 10% of total benchmark system cost',
    ],
    officialUrl: 'https://pmkusum.mnre.gov.in',
    portalName: 'Ministry of New & Renewable Energy Portal',
    helpline: '1800-180-3333',
    applicationDeadline: 'Ongoing state-wise quota release',
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC) Subsidized Credit Scheme',
    hindiName: 'किसान क्रेडिट कार्ड योजना',
    state: 'Central Schemes',
    category: 'Credit & Finance',
    type: 'Credit',
    shortDescription:
      'Institutional short-term crop loans up to ₹3.00 Lakh at an effective interest rate of just 4% per annum (with 2% interest subvention and 3% prompt repayment incentive).',
    benefit: 'Interest subvention rate of 4% p.a. with collateral-free limit up to ₹1.60 Lakh',
    eligibility: [
      'All owner-cultivators, tenant farmers, oral lessees and sharecroppers',
      'Self Help Groups (SHGs) or Joint Liability Groups (JLGs) of farmers',
      'Animal husbandry, dairy, and fisheries farmers also covered',
    ],
    officialUrl: 'https://www.jansamarth.in',
    portalName: 'Jan Samarth National Credit Portal',
    helpline: '1800-11-5526',
    applicationDeadline: 'Open throughout year across all commercial & RRB banks',
  },
  {
    id: 'smam',
    name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    hindiName: 'कृषि यंत्रीकरण उप-मिशन',
    state: 'Central Schemes',
    category: 'Farm Mechanization',
    type: 'Subsidy',
    shortDescription:
      'Capital subsidy of 40% to 50% for procurement of agricultural equipment like tractors, rotavators, power tillers, drone sprayers, and establishment of Custom Hiring Centers (CHCs).',
    benefit: '40% to 50% financial assistance on tractors, implements & agro drones',
    eligibility: [
      'Small and marginal farmers, SC/ST, women and northeastern farmers prioritized',
      'Registration on national agrimachinery DBT portal with land records',
    ],
    officialUrl: 'https://agrimachinery.nic.in',
    portalName: 'Direct Benefit Transfer in Agricultural Mechanization',
    helpline: '011-23382012',
    applicationDeadline: 'State-wise seasonal batch opening',
  },
  {
    id: 'pmksy-pdmc',
    name: 'PMKSY - Per Drop More Crop (Micro Irrigation)',
    hindiName: 'प्रधानमंत्री कृषि सिंचाई योजना - प्रति बूंद अधिक फसल',
    state: 'Central Schemes',
    category: 'Irrigation & Water',
    type: 'Subsidy',
    shortDescription:
      'Financial subsidy up to 55% for small/marginal farmers and 45% for other farmers for installing drip and sprinkler micro-irrigation systems to optimize water use efficiency.',
    benefit: 'Up to 55% subsidy on drip and micro-sprinkler installations',
    eligibility: [
      'Farmers with assured irrigation water source',
      'Valid land ownership or registered lease agreement of minimum 7 years',
    ],
    officialUrl: 'https://pmksy.gov.in',
    portalName: 'PMKSY National Portal',
    helpline: '1800-180-1551',
    applicationDeadline: 'Open for Kharif and Rabi pre-sowing',
  },

  // --- Maharashtra Schemes ---
  {
    id: 'namo-shetkari-mh',
    name: 'Namo Shetkari Mahasanman Nidhi Yojana (Maharashtra)',
    hindiName: 'नमो शेतकरी महासन्मान निधी योजना',
    state: 'Maharashtra',
    category: 'Income Support',
    type: 'State',
    shortDescription:
      'Maharashtra state top-up scheme providing an additional ₹6,000 annually to all PM-KISAN eligible farmers in the state, bringing the total annual support to ₹12,000.',
    benefit: '₹6,000 / year additional direct bank transfer (₹12,000 total with PM-KISAN)',
    eligibility: [
      'Farmers registered and eligible under PM-KISAN scheme in Maharashtra',
      'Verified 7/12 land record (Saat Baara Utara) and Aadhaar seeded account',
    ],
    officialUrl: 'https://mahadbt.maharashtra.gov.in',
    portalName: 'MahaDBT Farmer Welfare Portal',
    helpline: '022-49150800',
    applicationDeadline: 'Automatic integration for active PM-KISAN recipients',
  },
  {
    id: 'magel-tyala-solar-mh',
    name: 'Magel Tyala Saur Krishi Pump Yojana (MSEDCL Maharashtra)',
    hindiName: 'मागेल त्याला सौर कृषी पंप योजना',
    state: 'Maharashtra',
    category: 'Solar & Energy',
    type: 'Subsidy',
    shortDescription:
      'Provides high-efficiency solar water pumps up to 7.5 HP on demand to farmers without electrical grid connections, requiring only 5% to 10% farmer share payment.',
    benefit: '90% to 95% total subsidy on 3HP, 5HP, and 7.5HP solar pumps',
    eligibility: [
      'Farmers with land records in Maharashtra lacking regular electric agricultural connection',
      'Borewell, dug well, or perennial canal river lifting source available',
    ],
    officialUrl: 'https://www.mahadiscom.in/solar_MTSKPY/',
    portalName: 'MahaVitaran MSEDCL Solar Agriculture Portal',
    helpline: '1912 / 1800-233-3435',
    applicationDeadline: 'Continuous allotment on MahaVitaran portal',
  },

  // --- Andhra Pradesh ---
  {
    id: 'ysr-rythu-bharosa-ap',
    name: 'YSR Rythu Bharosa - PM-KISAN (Andhra Pradesh)',
    hindiName: 'వైఎస్సార్ రైతు భరోసా పథకం',
    state: 'Andhra Pradesh',
    category: 'Income Support',
    type: 'State',
    shortDescription:
      'Financial input assistance of ₹13,500 per year per farmer family (including ₹6,000 PM-KISAN component and ₹7,500 state grant) extending also to SC/ST/BC/Minority tenant farmers.',
    benefit: '₹13,500 per year in 3 seasonal tranches before Kharif, Rabi & Sankranti',
    eligibility: [
      'All landholding families and eligible tenant farmers possessing CCRC cards',
      'Must be registered under e-Crop booking system in Andhra Pradesh',
    ],
    officialUrl: 'https://ysrrythubharosa.ap.gov.in',
    portalName: 'AP Rythu Bharosa Official Portal',
    helpline: '1902 / 155251',
    applicationDeadline: 'Seasonal verification via Rythu Bharosa Kendras (RBKs)',
  },

  // --- Telangana ---
  {
    id: 'rythu-bandhu-ts',
    name: 'Rythu Bandhu & Rythu Bima (Telangana)',
    hindiName: 'రైతు బంధు పథకం',
    state: 'Telangana',
    category: 'Income Support',
    type: 'State',
    shortDescription:
      'Agriculture Investment Support Scheme disbursing ₹10,000 per acre per year (₹5,000 each for Kharif and Rabi) for purchase of agricultural inputs, alongside ₹5 Lakh life insurance.',
    benefit: '₹10,000 / acre per year + ₹5 Lakh free life insurance coverage',
    eligibility: [
      'Pattedar farmers having digitized digital passbooks (Dharani portal)',
      'Cultivating agricultural lands in Telangana state',
    ],
    officialUrl: 'https://rythubandhu.telangana.gov.in',
    portalName: 'Telangana Agriculture Department Portal',
    helpline: '040-23383520',
    applicationDeadline: 'Disbursed prior to Kharif and Rabi seasons',
  },

  // --- Karnataka ---
  {
    id: 'raitha-siri-ka',
    name: 'Karnataka Raitha Siri & Krishi Bhagya Scheme',
    hindiName: 'ರೈತ ಸಿರಿ ಹಾಗೂ ಕೃಷಿ ಭಾಗ್ಯ ಯೋಜನೆ',
    state: 'Karnataka',
    category: 'Organic & Bio-Inputs',
    type: 'Subsidy',
    shortDescription:
      'Financial incentive of ₹10,000 per hectare for farmers cultivating millets (Siri Dhanya: Ragi, Jowar, Bajra) and 80% subsidy for polyhouse and farm ponds under Krishi Bhagya.',
    benefit: '₹10,000 per hectare for millet growers + up to 80% subsidy on farm ponds',
    eligibility: [
      'Farmers registered on Karnataka FRUITS (Farmer Registration and Unified Beneficiary Information System)',
      'Verified RTC pahani land documents',
    ],
    officialUrl: 'https://fruits.karnataka.gov.in',
    portalName: 'Karnataka FRUITS & Raitha Mitra Portal',
    helpline: '080-22212861',
    applicationDeadline: 'Annual Kharif sowing window',
  },

  // --- Tamil Nadu ---
  {
    id: 'kalaignar-agri-tn',
    name: 'Kalaignarin All Village Integrated Agriculture Scheme (Tamil Nadu)',
    hindiName: 'கலைஞரின் அனைத்து கிராம ஒருங்கிணைந்த வேளாண் வளர்ச்சி திட்டம்',
    state: 'Tamil Nadu',
    category: 'Horticulture & Seeds',
    type: 'State',
    shortDescription:
      'Comprehensive village-level development program supplying 100% subsidized certified seed kits, coconut saplings, solar dryers, and 100% micro-irrigation subsidy for small farmers.',
    benefit: '100% micro-irrigation subsidy for small/marginal farmers & free bio-fertilizers',
    eligibility: [
      'Farmers resident in selected Village Panchayats of Tamil Nadu',
      'Registered on Uzhavan App and TN AGRISNET portal',
    ],
    officialUrl: 'https://www.tnagrisnet.tn.gov.in',
    portalName: 'Tamil Nadu AGRISNET Official Portal',
    helpline: '1800-425-4444 (Uzhavan Helpline)',
    applicationDeadline: 'Village-wise camp schedules',
  },

  // --- Kerala ---
  {
    id: 'subhiksha-keralam',
    name: 'Subhiksha Keralam & Karshaka Pension (Kerala)',
    hindiName: 'സുഭിക്ഷ കേരളം പദ്ധതി',
    state: 'Kerala',
    category: 'Income Support',
    type: 'State',
    shortDescription:
      'Integrated food self-sufficiency program offering subsidies for fallow land cultivation, polyhouses, homestead vegetable farming, and monthly old-age farmers pension.',
    benefit: '₹40,000/ha for fallow paddy cultivation + ₹1,600/month welfare pension',
    eligibility: [
      'Individual farmers, Kudumbashree groups, and youth collectives in Kerala',
      'Enrolled on AIMS (Agricultural Information Management System) portal',
    ],
    officialUrl: 'https://www.aims.kerala.gov.in',
    portalName: 'Kerala Agriculture AIMS Portal',
    helpline: '0471-2303990',
    applicationDeadline: 'Continuous registration via Krishi Bhavans',
  },

  // --- Gujarat ---
  {
    id: 'ikhedut-gujarat',
    name: 'i-Khedut Comprehensive Agricultural Subsidy Portal (Gujarat)',
    hindiName: 'આઈ-ખેડૂત યોજનાઓ (ગુજરાત)',
    state: 'Gujarat',
    category: 'Farm Mechanization',
    type: 'Subsidy',
    shortDescription:
      'Unified single-window portal providing subsidies for pipeline laying, tractors, micro-irrigation, cattle shed construction, fruit orchard planting, and solar fencing.',
    benefit: 'Up to 75% subsidy on irrigation pipelines, solar electric fencing & power tillers',
    eligibility: [
      'Farmers holding 7/12 and 8-A land records in Gujarat',
      'Active bank account linked with Aadhaar in Gujarat rural branches',
    ],
    officialUrl: 'https://ikhedut.gujarat.gov.in',
    portalName: 'Gujarat i-Khedut Portal',
    helpline: '1800-180-1551',
    applicationDeadline: 'Batch window opens quarterly',
  },

  // --- Rajasthan ---
  {
    id: 'rajkisan-sathi',
    name: 'Mukhyamantri Krishi Sathi & RajKisan Portal (Rajasthan)',
    hindiName: 'मुख्यमंत्री कृषि साथी योजना (राजस्थान)',
    state: 'Rajasthan',
    category: 'Irrigation & Water',
    type: 'Subsidy',
    shortDescription:
      'Provides financial grant for digging farm ponds, setting up micro-irrigation systems, seed production kits, and direct compensation for accidental death or injury during farm work.',
    benefit: 'Up to ₹1,35,000 grant for farm pond construction + 75% drip irrigation subsidy',
    eligibility: [
      'Registered Jan Aadhaar cardholders owning agricultural land in Rajasthan',
      'Application submitted via RajKisan Sathi mobile application',
    ],
    officialUrl: 'https://rajkisan.rajasthan.gov.in',
    portalName: 'RajKisan Sathi Portal',
    helpline: '0141-2922613 / 181',
    applicationDeadline: 'Pre-monsoon and post-monsoon windows',
  },

  // --- Madhya Pradesh ---
  {
    id: 'kisan-kalyan-mp',
    name: 'Mukhyamantri Kisan Kalyan Yojana (Madhya Pradesh)',
    hindiName: 'मुख्यमंत्री किसान कल्याण योजना (मध्य प्रदेश)',
    state: 'Madhya Pradesh',
    category: 'Income Support',
    type: 'State',
    shortDescription:
      'Madhya Pradesh state supplement providing ₹6,000 per year in two equal installments to all PM-KISAN beneficiaries in MP, totalizing ₹12,000 per year per farmer.',
    benefit: '₹6,000 / year additional direct bank transfer (₹12,000 total with PM-KISAN)',
    eligibility: [
      'All farmers registered and receiving benefits under PM-KISAN in Madhya Pradesh',
      'Verified land records on SAARA portal with completed e-KYC',
    ],
    officialUrl: 'https://saara.mp.gov.in',
    portalName: 'MP SAARA Farmer Welfare Portal',
    helpline: '0755-2700800',
    applicationDeadline: 'Auto-seeded via PM-KISAN MP registry',
  },

  // --- Uttar Pradesh ---
  {
    id: 'up-paradarshi-kisan',
    name: 'UP Paradarshi Kisan Seva & Krishi Yantra (Uttar Pradesh)',
    hindiName: 'उत्तर प्रदेश पारदर्शी किसान सेवा पोर्टल',
    state: 'Uttar Pradesh',
    category: 'Farm Mechanization',
    type: 'Subsidy',
    shortDescription:
      'Direct Benefit Transfer portal of UP government offering up to 50% subsidy on farm implements (laser land leveler, rotavator, straw reaper, custom hiring centres, and solar pumps).',
    benefit: 'Up to 50% direct DBT reimbursement on agricultural machinery',
    eligibility: [
      'Farmers registered on UP Agriculture portal with valid Khasra/Khatauni',
      'Token system booking on first-come-first-serve basis through online lottery',
    ],
    officialUrl: 'https://upagripardarshi.gov.in',
    portalName: 'UP Agriculture Paradarshi Portal',
    helpline: '0522-2204550 / 7235090543',
    applicationDeadline: 'Online token generation announced season-wise',
  },

  // --- Punjab ---
  {
    id: 'punjab-crm-subsidy',
    name: 'Punjab Crop Residue Management (CRM) Machine Subsidy',
    hindiName: 'ਪੰਜਾਬ ਫਸਲੀ ਰਹਿੰਦ-ਖੂੰਹਦ ਪ੍ਰਬੰਧਨ ਸਬਸਿਡੀ ਸਕੀਮ',
    state: 'Punjab',
    category: 'Farm Mechanization',
    type: 'Subsidy',
    shortDescription:
      'Financial assistance of 50% to individual farmers and 80% to Cooperative Societies / Panchayats for purchasing in-situ paddy straw management machines (Super Seeder, Smart Seeder, Mulcher, Baler).',
    benefit: '50% individual subsidy, 80% group subsidy on Super Seeders & Balers',
    eligibility: [
      'Farmers cultivating paddy in Punjab with registered land records',
      'FPOs, registered cooperative societies, and village panchayats',
    ],
    officialUrl: 'https://agripb.gov.in',
    portalName: 'Department of Agriculture Punjab Portal',
    helpline: '1800-180-1551',
    applicationDeadline: 'July to September prior to paddy harvesting',
  },

  // --- Haryana ---
  {
    id: 'meri-fasal-haryana',
    name: 'Meri Fasal Mera Byora & Bhavantar Bharpayee (Haryana)',
    hindiName: 'मेरी फसल मेरा ब्योरा योजना (हरियाणा)',
    state: 'Haryana',
    category: 'Income Support',
    type: 'State',
    shortDescription:
      'Comprehensive registration portal for MSP procurement, financial compensation under Bhavantar Bharpayee for horticulture crops when market rates fall below cost of production, and ₹7,000/acre for crop diversification.',
    benefit: 'Guaranteed MSP procurement + price deficiency compensation + ₹7,000/acre diversification grant',
    eligibility: [
      'All farmers cultivating land in Haryana (residents or landholders)',
      'Parivar Pehchan Patra (PPP / Family ID) mandatory',
    ],
    officialUrl: 'https://fasal.haryana.gov.in',
    portalName: 'Meri Fasal Mera Byora Portal',
    helpline: '1800-180-2117 / 1800-180-2060',
    applicationDeadline: 'Kharif: August 31 | Rabi: January 31',
  },

  // --- West Bengal ---
  {
    id: 'krishak-bandhu-wb',
    name: 'Krishak Bandhu Scheme (West Bengal)',
    hindiName: 'কৃষক বন্ধু প্রকল্প (পশ্চিমবঙ্গ)',
    state: 'West Bengal',
    category: 'Income Support',
    type: 'State',
    shortDescription:
      'Provides assured financial assistance of ₹10,000 per year (minimum ₹4,000 for small holdings) in two installments (Kharif & Rabi) plus ₹2,00,000 death benefit for farmer families.',
    benefit: 'Up to ₹10,000 per year input grant + ₹2,00,000 natural/accidental death grant',
    eligibility: [
      'All farmers and recorded bargadars (sharecroppers) in West Bengal',
      'Age between 18 to 60 years for death benefit component',
    ],
    officialUrl: 'https://krishakbandhu.wb.gov.in',
    portalName: 'Krishak Bandhu Official WB Portal',
    helpline: '8336957370 / 033-22259114',
    applicationDeadline: 'Disbursed during Boishakh (Kharif) and Aghrayan (Rabi)',
  },

  // --- Odisha ---
  {
    id: 'kalia-odisha',
    name: 'KALIA Scheme (Krushak Assistance for Livelihood - Odisha)',
    hindiName: 'କାଳିଆ ଯୋଜନା (ଓଡ଼ିଶା)',
    state: 'Odisha',
    category: 'Income Support',
    type: 'State',
    shortDescription:
      'Financial support of ₹10,000 per family for cultivation across five seasons for small and marginal farmers, plus ₹12,500 for landless agricultural households for livelihood activities.',
    benefit: '₹10,000 / year cultivation support + ₹12,500 for landless farm laborers',
    eligibility: [
      'Small and marginal farmers, landless agricultural households in Odisha',
      'Aadhaar seeded bank account with valid ration card',
    ],
    officialUrl: 'https://kalia.odisha.gov.in',
    portalName: 'KALIA Odisha Government Portal',
    helpline: '1800-572-1122',
    applicationDeadline: 'Continuous inclusion through Gram Panchayat camps',
  },

  // --- Bihar ---
  {
    id: 'bihar-dbt-agri',
    name: 'Bihar Krishi Input Subsidy & Diesel Anudan',
    hindiName: 'बिहार कृषि इनपुट अनुदान एवं डीजल सब्सिडी योजना',
    state: 'Bihar',
    category: 'Credit & Finance',
    type: 'Subsidy',
    shortDescription:
      'Direct input subsidy of ₹6,800 to ₹17,000 per hectare for crop losses due to excessive rain, drought, or hail, plus ₹75 per liter diesel grant for irrigation during dry spells.',
    benefit: 'Up to ₹17,000/ha natural calamity loss compensation + diesel irrigation subsidy',
    eligibility: [
      'Registered farmers on Bihar DBT Agriculture portal with LPC (Land Possession Certificate)',
      'Both self-cultivators and tenant farmers eligible with ward member certification',
    ],
    officialUrl: 'https://dbtagriculture.bihar.gov.in',
    portalName: 'Bihar Agriculture DBT Portal',
    helpline: '1800-180-1551',
    applicationDeadline: 'Announced following calamity assessment',
  },

  // --- Assam ---
  {
    id: 'assam-krishi-sajuli',
    name: 'Mukhyamantri Krishi Sa-Sajuli Yojana (Assam)',
    hindiName: 'মুখ্যমন্ত্ৰী কৃষি সা-সঁজুলি যোজনা (অসম)',
    state: 'Assam',
    category: 'Farm Mechanization',
    type: 'State',
    shortDescription:
      'One-time financial assistance of ₹5,000 transferred via DBT to small and marginal farmers for procurement of farm implements and tools to increase farm productivity.',
    benefit: '₹5,000 direct bank transfer per farmer for procurement of hand tools & sprayers',
    eligibility: [
      'Small and marginal farmers resident in rural areas of Assam',
      'Continuous farming background of at least 3 years with valid bank passbook',
    ],
    officialUrl: 'https://diragri.assam.gov.in',
    portalName: 'Directorate of Agriculture Assam',
    helpline: '1800-345-3525',
    applicationDeadline: 'Annual district agriculture office drive',
  },

  // --- Himachal Pradesh ---
  {
    id: 'hp-natural-farming',
    name: 'Prakritik Kheti Khushhal Kisan Yojana (Himachal Pradesh)',
    hindiName: 'प्राकृतिक खेती खुशहाल किसान योजना (हिमाचल प्रदेश)',
    state: 'Himachal Pradesh',
    category: 'Organic & Bio-Inputs',
    type: 'Subsidy',
    shortDescription:
      'Provides 50% subsidy up to ₹25,000 for purchasing indigenous cows (desi cow), ₹8,000 grant for cow shed construction, and free resource drums for Subhash Palekar Natural Farming.',
    benefit: 'Up to ₹25,000 for indigenous cow purchase + 80% subsidy on bio-drums',
    eligibility: [
      'Farmers resident in Himachal Pradesh adopting non-chemical natural farming',
      'Must undergo SPNF certified farmer training',
    ],
    officialUrl: 'https://spnfhp.nic.in',
    portalName: 'State Project Implementing Unit (SPNF HP)',
    helpline: '0177-2831206',
    applicationDeadline: 'Open throughout year across all ATMA blocks',
  },

  // --- Jammu & Kashmir ---
  {
    id: 'hadp-jk',
    name: 'Holistic Agriculture Development Programme (HADP J&K)',
    hindiName: 'مرکزی ہیڈ پی زرعی اسکیم جموں و کشمیر',
    state: 'Jammu & Kashmir',
    category: 'Horticulture & Seeds',
    type: 'State',
    shortDescription:
      'Ambitious 29-project modernization program for J&K offering up to 80% capital subsidies for High-Density Apple orchards, saffron rejuvenation, cold storage chains, and trout fisheries.',
    benefit: 'Up to 80% capital subsidy on High-Density Fruit Plants, Drip & Trellis setup',
    eligibility: [
      'Farmers, orchardists, and agrarian youth holding land in UT of Jammu & Kashmir',
      'Registration on online HADP DAKSH / KISAN SAMPARK portal',
    ],
    officialUrl: 'https://hadp.jk.gov.in',
    portalName: 'J&K HADP Official Portal',
    helpline: '1800-180-7011',
    applicationDeadline: 'Quarterly review allocations',
  },

  // --- Chhattisgarh ---
  {
    id: 'cg-kisan-nyay',
    name: 'Rajiv Gandhi Kisan Nyay Yojana (Chhattisgarh)',
    hindiName: 'राजीव गांधी किसान न्याय योजना (छत्तीसगढ़)',
    state: 'Chhattisgarh',
    category: 'Income Support',
    type: 'State',
    shortDescription:
      'Provides input subsidy of up to ₹9,000 per acre per year via DBT for paddy, maize, kodo-kutki, pulses, and oilseeds cultivators to enhance crop diversification.',
    benefit: 'Input subsidy of up to ₹9,000 / acre credited directly to bank account in 4 installments',
    eligibility: [
      'Farmers registered on RGKNY portal cultivating kharif crops in Chhattisgarh',
      'All categories of landholders including sharecroppers and forest right leaseholders',
    ],
    officialUrl: 'https://kisan.cg.nic.in',
    portalName: 'Chhattisgarh Kisan Portal',
    helpline: '0771-2443923',
    applicationDeadline: 'Annual kharif enrollment window',
  },

  // --- Jharkhand ---
  {
    id: 'jh-kisan-karj-rahat',
    name: 'Jharkhand Krishi Rin Mafi Yojana (JKRMY)',
    hindiName: 'झारखंड कृषि ऋण माफी योजना',
    state: 'Jharkhand',
    category: 'Credit & Finance',
    type: 'State',
    shortDescription:
      'Waives short-term agricultural crop loans up to ₹50,000 for small and marginal landholding farmers in Jharkhand via standard bank branch verification.',
    benefit: 'Waiver of outstanding crop loans up to ₹50,000 via Aadhaar DBT match',
    eligibility: [
      'Permanent resident farmers of Jharkhand holding valid Kisan Credit Card (KCC)',
      'Single family loan account waiver cap of ₹50,000',
    ],
    officialUrl: 'https://jkrmy.jharkhand.gov.in',
    portalName: 'Jharkhand Krishi Rin Mafi Portal',
    helpline: '0651-2490514',
    applicationDeadline: 'Continuous through designated CSC / bank branches',
  },

  // --- Uttarakhand ---
  {
    id: 'uk-apple-mission',
    name: 'Uttarakhand Apple & Mountain Horticulture Mission',
    hindiName: 'उत्तराखंड सेब एवं पर्वतीय बागवानी मिशन',
    state: 'Uttarakhand',
    category: 'Horticulture & Seeds',
    type: 'Subsidy',
    shortDescription:
      'Subsidizes high-density apple, walnut, and kiwi plantations in hill districts with up to 80% cost assistance for clonal rootstocks, anti-hail nets, and drip networks.',
    benefit: '80% subsidy on high-density fruit plants, anti-hail netting, and micro-irrigation',
    eligibility: [
      'Farmers holding agricultural/horticultural land in hill districts of Uttarakhand',
      'Minimum contiguous parcel of 0.2 hectare for high-density orchard setup',
    ],
    officialUrl: 'https://shm.uk.gov.in',
    portalName: 'State Horticulture Mission Uttarakhand',
    helpline: '0135-2712240',
    applicationDeadline: 'Autumn plantation drive every year',
  },

  // --- Goa ---
  {
    id: 'goa-shetdari-card',
    name: 'Goa Krishi Card & Farm Mechanization Assistance',
    hindiName: 'गोवा कृषी कार्ड व कृषी यांत्रिकीकरण योजना',
    state: 'Goa',
    category: 'Farm Mechanization',
    type: 'Subsidy',
    shortDescription:
      'Provides up to 75% subsidy for purchase of power tillers, paddy transplanters, grass cutters, and solar fencing to prevent wildlife crop depredation in Goa.',
    benefit: 'Up to 75% subsidy on machinery + 90% subsidy on solar perimeter fencing',
    eligibility: [
      'Resident farmers of Goa holding valid Krishi Card issued by Dept of Agriculture',
      'Cultivating paddy, cashew, arecanut, or horticulture crops in Goa',
    ],
    officialUrl: 'https://agri.goa.gov.in',
    portalName: 'Directorate of Agriculture Goa',
    helpline: '0832-2465840',
    applicationDeadline: 'Open enrollment through Zonal Agriculture Offices (ZAO)',
  },

  // --- Tripura ---
  {
    id: 'tripura-bamboo-horti',
    name: 'Tripura Horticulture & Exotic Fruit Plantation Scheme',
    hindiName: 'ত্রিপুরা ড্রাগন ফ্রুট ও উদ্যানপালন প্রকল্প',
    state: 'Tripura',
    category: 'Horticulture & Seeds',
    type: 'Subsidy',
    shortDescription:
      'Provides 70% financial grant for commercial cultivation of Dragon Fruit, Queen Pineapple, and Betel vine, alongside organic vermicompost pit construction.',
    benefit: '₹1,20,000 / hectare subsidy for Dragon Fruit trellis and planting material',
    eligibility: [
      'Farmers resident in Tripura owning cultivable upland or tilla land',
      'Preference to tribal and small farming communities',
    ],
    officialUrl: 'https://agri.tripura.gov.in',
    portalName: 'Department of Agriculture & Farmers Welfare Tripura',
    helpline: '0381-2323883',
    applicationDeadline: 'Pre-monsoon application cycle',
  },

  // --- Meghalaya ---
  {
    id: 'meghalaya-lakadong-mission',
    name: 'Meghalaya Mission Lakadong & Ginger Processing',
    hindiName: 'মেঘালয় লাকাডং হলুদ মিশন',
    state: 'Meghalaya',
    category: 'Organic & Bio-Inputs',
    type: 'State',
    shortDescription:
      'State flagship initiative providing high-curcumin Lakadong turmeric seed rhizomes, washing/slicing machinery, solar dryers, and guaranteed organic buyback linkage.',
    benefit: 'Free organic certified seed rhizomes + 75% machinery subsidy for grower groups',
    eligibility: [
      'Farmer Producer Organizations (FPOs) and indigenous growers in Meghalaya',
      'Commitment to 100% organic agrochemical-free cultivation protocol',
    ],
    officialUrl: 'https://megagriculture.gov.in',
    portalName: 'Directorate of Agriculture Meghalaya',
    helpline: '0364-2223789',
    applicationDeadline: 'Seasonal distribution drive',
  },

  // --- Manipur ---
  {
    id: 'manipur-organic-mission',
    name: 'Manipur Organic Mission Agency (MOMA)',
    hindiName: 'মণিপুর ওর্গানিক মিশন এজেন্সী',
    state: 'Manipur',
    category: 'Organic & Bio-Inputs',
    type: 'State',
    shortDescription:
      'Assists farmers in organic certification for Chak-hao (Black Rice), Kachai Lemon, and Sirarakhong chilli, with end-to-end cold storage and export facilitation.',
    benefit: '100% free organic certification fees + ₹10,000/ha input support for 3 years',
    eligibility: [
      'Farmers and farmer clusters in hill and valley districts of Manipur',
      'Enrolled through registered Farmer Producer Companies (FPCs)',
    ],
    officialUrl: 'https://moma.manipur.gov.in',
    portalName: 'Manipur Organic Mission Agency',
    helpline: '0385-2414013',
    applicationDeadline: 'Annual cluster mobilization',
  },

  // --- Nagaland ---
  {
    id: 'nagaland-jhum-transformation',
    name: 'Nagaland Jhum Soil Conservation & Terraced Farming Grant',
    hindiName: 'নাগাল্যান্ড জুম চাষ রূপান্তর ও সোপান কৃষি অনুদান',
    state: 'Nagaland',
    category: 'Irrigation & Water',
    type: 'State',
    shortDescription:
      'Provides community grants and materials for converting shifting jhum slopes into bench-terraced paddy fields with micro water harvesting check-dams.',
    benefit: '₹35,000 / hectare financial assistance for bench terracing & stone bunding',
    eligibility: [
      'Village council recognized agrarian families practicing hill agriculture in Nagaland',
    ],
    officialUrl: 'https://agriculture.nagaland.gov.in',
    portalName: 'Nagaland Department of Agriculture',
    helpline: '0370-2270072',
    applicationDeadline: 'Dry season earthwork window',
  },

  // --- Mizoram ---
  {
    id: 'mizoram-sedp-agri',
    name: 'Mizoram Socio-Economic Development Policy (SEDP Agri Grant)',
    hindiName: 'Mizoram SEDP Loneitu Chawikan Thil Tum',
    state: 'Mizoram',
    category: 'Income Support',
    type: 'State',
    shortDescription:
      'Direct grant of up to ₹50,000 to selected farm families for ginger, bird’s eye chilli, and oil palm production, including nursery development and storage.',
    benefit: 'Direct financial assistance up to ₹50,000 disbursed in phases per household',
    eligibility: [
      'Full-time farming households holding valid land-pass or village council allotment in Mizoram',
    ],
    officialUrl: 'https://agriculturemizoram.nic.in',
    portalName: 'Agriculture Department Government of Mizoram',
    helpline: '0389-2322437',
    applicationDeadline: 'Annual SEDP district selection rounds',
  },

  // --- Sikkim ---
  {
    id: 'sikkim-organic-incentive',
    name: 'Sikkim 100% Organic Production & Export Incentive',
    hindiName: 'सिक्किम जैविक उत्पादन प्रोत्साहन योजना',
    state: 'Sikkim',
    category: 'Organic & Bio-Inputs',
    type: 'State',
    shortDescription:
      'Production incentive of ₹10/kg on large cardamom, ₹8/kg on ginger, and ₹5/kg on buckwheat produced under certified 100% organic protocols in Sikkim.',
    benefit: 'Direct per-kilogram cash incentive for certified organic harvest yields',
    eligibility: [
      'Certified organic farmers registered under Sikkim Organic Mission',
      'Sale receipts verified through state marketing federation (SIMFED)',
    ],
    officialUrl: 'https://sikkimorganicmission.gov.in',
    portalName: 'Sikkim Organic Mission Portal',
    helpline: '03592-281261',
    applicationDeadline: 'Harvest season submission quarterly',
  },

  // --- Arunachal Pradesh ---
  {
    id: 'arunachal-krishi-yojana',
    name: 'Chief Minister Krishi Rinn Yojana (Arunachal Pradesh)',
    hindiName: 'मुख्य मंत्री कृषि ऋण योजना (अरुणाचल प्रदेश)',
    state: 'Arunachal Pradesh',
    category: 'Credit & Finance',
    type: 'Subsidy',
    shortDescription:
      'Offers 4% interest subvention on crop loans up to ₹3,00,000 availed through commercial and apex banks, effectively providing 0% net interest to timely repayers.',
    benefit: 'Zero percent (0%) net interest on crop loans up to ₹3 Lakh for punctual farmers',
    eligibility: [
      'Indigenous and resident farmers in Arunachal Pradesh holding LPC or village certification',
      'Timely repayment within 1 year of loan disbursement',
    ],
    officialUrl: 'https://arunachalpradesh.gov.in',
    portalName: 'Arunachal Pradesh State Portal',
    helpline: '0360-2212328',
    applicationDeadline: 'Year-round via participating banking channels',
  },

  // --- Ladakh ---
  {
    id: 'ladakh-seabuckthorn-greenhouse',
    name: 'Ladakh High-Altitude Solar Greenhouse & Seabuckthorn Mission',
    hindiName: 'لداخ سولر گرین ہاؤس اور سی بک تھورن مشن',
    state: 'Ladakh',
    category: 'Solar & Energy',
    type: 'Subsidy',
    shortDescription:
      'Provides up to 75% capital subsidy for building passive solar earth-sheltered greenhouses to cultivate fresh winter vegetables at sub-zero temperatures in Leh and Kargil.',
    benefit: '75% subsidy (up to ₹2,50,000) for passive solar trench / polycarbonate greenhouses',
    eligibility: [
      'Resident agrarian families in Leh and Kargil districts',
      'Minimum winter cultivation pledge for leafy greens and seabuckthorn harvesting',
    ],
    officialUrl: 'https://ladakh.gov.in',
    portalName: 'Administration of Union Territory of Ladakh',
    helpline: '01982-255560',
    applicationDeadline: 'Pre-winter construction cycle',
  },

  // --- Delhi ---
  {
    id: 'delhi-solar-pump-periurban',
    name: 'Delhi Peri-Urban Solar Irrigation & Micro-Farming Scheme',
    hindiName: 'दिल्ली सौर सिंचाई एवं पेरी-अर्बन कृषि प्रोत्साहन योजना',
    state: 'Delhi',
    category: 'Solar & Energy',
    type: 'Subsidy',
    shortDescription:
      'Provides up to 80% capital grant for installing solar PV water pumping systems and hydroponic green fodder units across peri-urban agricultural belts of Najafgarh and Alipur.',
    benefit: 'Up to 80% subsidy on 3HP - 7.5HP solar surface & submersible agricultural pumps',
    eligibility: [
      'Farmers holding cultivable agricultural land in rural villages of NCT of Delhi',
      'Valid electricity bill or tubewell declaration',
    ],
    officialUrl: 'https://delhi.gov.in',
    portalName: 'Government of NCT of Delhi Agriculture Wing',
    helpline: '011-23392404',
    applicationDeadline: 'Periodic department portal intake',
  },

  // --- Puducherry ---
  {
    id: 'puducherry-paddy-bonus',
    name: 'Puducherry Input Relief & Paddy Procurement Bonus',
    hindiName: 'புதுச்சேரி நெல் கொள்முதல் போனஸ் மற்றும் இடுபொருள் நிவாரணம்',
    state: 'Puducherry',
    category: 'Income Support',
    type: 'State',
    shortDescription:
      'Provides an additional state incentive bonus of ₹500/quintal over and above Central MSP for paddy procured through authorized government PACS and direct input relief.',
    benefit: '₹500 / quintal state bonus over MSP + ₹5,000/ha natural calamity input subsidy',
    eligibility: [
      'Registered farmers of Puducherry, Karaikal, Mahe, and Yanam regions',
      'Paddy sold through designated Primary Agricultural Cooperative Societies (PACS)',
    ],
    officialUrl: 'https://agri.py.gov.in',
    portalName: 'Department of Agriculture Puducherry',
    helpline: '0413-2336381',
    applicationDeadline: 'Samba and Kuruvai harvest marketing cycles',
  },
];
