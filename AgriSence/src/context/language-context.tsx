import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EXTENDED_TRANSLATIONS } from '@/src/lib/translations/extended';
import { APP_PAGE_TRANSLATIONS } from '@/src/lib/translations/app-pages';
import { COMMAND_CENTER_TRANSLATIONS } from '@/src/lib/translations/command-center';

export interface LanguageOption {
  id: string;
  label: string;
  nativeName: string;
  speechCode: string;
  sampleQuery: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    id: 'en',
    label: 'English',
    nativeName: 'English',
    speechCode: 'en-IN',
    sampleQuery: 'What is the optimal fertilizer dosage for wheat in sandy loam?',
  },
  {
    id: 'hi',
    label: 'हिंदी (Hindi)',
    nativeName: 'हिंदी',
    speechCode: 'hi-IN',
    sampleQuery: 'सोयाबीन में कीट नियंत्रण के लिए जैविक उपाय क्या हैं?',
  },
  {
    id: 'mr',
    label: 'मराठी (Marathi)',
    nativeName: 'मराठी',
    speechCode: 'mr-IN',
    sampleQuery: 'कापसावरील बोंडअळी कशी रोखायची आणि खताचे प्रमाण काय?',
  },
  {
    id: 'bn',
    label: 'বাংলা (Bengali)',
    nativeName: 'বাংলা',
    speechCode: 'bn-IN',
    sampleQuery: 'ধানের ব্লাস্ট রোগের জন্য কী স্প্রে করব?',
  },
  {
    id: 'te',
    label: 'తెలుగు (Telugu)',
    nativeName: 'తెలుగు',
    speechCode: 'te-IN',
    sampleQuery: 'టమోటా తెల్లదోమ నివారణకు ఆర్గానిక్ మందులు ఏమిటి?',
  },
  {
    id: 'ta',
    label: 'தமிழ் (Tamil)',
    nativeName: 'தமிழ்',
    speechCode: 'ta-IN',
    sampleQuery: 'மஞ்சள் பயிரில் அழுகல் நோயை தடுப்பது எப்படி?',
  },
  {
    id: 'gu',
    label: 'ગુજરાતી (Gujarati)',
    nativeName: 'ગુજરાતી',
    speechCode: 'gu-IN',
    sampleQuery: 'કપાસમાં ગુલાબી ઈયળ માટે કઈ દવા છાંટવી?',
  },
  {
    id: 'pa',
    label: 'ਪੰਜਾਬੀ (Punjabi)',
    nativeName: 'ਪੰਜਾਬੀ',
    speechCode: 'pa-IN',
    sampleQuery: 'ਕਣਕ ਦੀ ਫ਼ਸਲ ਲਈ ਯੂਰੀਆ ਕਦੋਂ ਅਤੇ ਕਿੰਨਾ ਪਾਉਣਾ ਚਾਹੀਦਾ ਹੈ?',
  },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Navbar
    'nav.capabilities': 'Platform Capabilities',
    'nav.outbreak': 'Outbreak Radar',
    'nav.pestScan': 'AI Pest Scan',
    'nav.arbitrage': 'Mandi Arbitrage',
    'nav.schemes': 'Govt Schemes',
    'nav.dashboard': 'Dashboard',
    'nav.voiceAi': 'Voice AI',
    'nav.signIn': 'Sign In',
    'nav.getStarted': 'Get Started',
    'nav.tickerTitle': 'APMC Live Modal Ticker',

    // Hero
    'hero.badge': 'AI-powered agriculture, reimagined for India',
    'hero.title1': 'Smart Farming.',
    'hero.title2': 'Better Future.',
    'hero.desc':
      'One platform for every farming decision — weather intelligence, AI pest diagnosis, real-time outbreak warnings, satellite monitoring, APMC marketplace, and agricultural subsidies. AgriSence unites the entire farming ecosystem into a single, beautiful experience.',
    'hero.btnDashboard': 'Launch Dashboard →',
    'hero.btnPestScan': 'AI Pest Scan',
    'hero.metric1': '98.4% AI Accuracy',
    'hero.metric2': '72-hr Outbreak Warning',
    'hero.metric3': '24/7 Agro Assistant',

    // Floating Cards
    'float.card1.loc': 'Nagpur, MH',
    'float.card1.hum': '💧 62% humidity',
    'float.card1.wind': '🍃 12 km/h',
    'float.card2.ai': 'AgriSense AI',
    'float.card2.tag': 'ADVISORY',
    'float.card2.text': 'Sow soybean between Jun 15–25 for +18% yield.',
    'float.card3.soil': 'Soil Telemetry',
    'float.card4.mandi': 'Soybean • Nagpur Mandi',

    // Stats
    'stats.s1.label': 'Pest Detection Accuracy',
    'stats.s1.sub': 'Use your verified field records',
    'stats.s2.label': 'Targeted Pest Species',
    'stats.s2.sub': 'Endemic Indian crop pathologies',
    'stats.s3.label': 'Acres Protected',
    'stats.s3.sub': 'Across 14 Agro-Climatic Zones',
    'stats.s4.label': 'Pesticide Cost Reduction',
    'stats.s4.sub': 'Via precision bio-wash dosage',

    // Features Section - User specific titles
    'feat.tag': '20+ Precision Agronomic Simulators & Capabilities',
    'feat.title': 'Intelligent Pest Control & Agronomic Precision',
    'feat.desc':
      'From micro-droplet spray physics and chemical tank compatibility to forward APMC storage arbitrage and Sentinel-2 pixel analysis.',
    'feat.cat.All': 'All',
    'feat.cat.Diagnostics': 'Diagnostics',
    'feat.cat.Application Tech': 'Application Tech',
    'feat.cat.Chemical Safety': 'Chemical Safety',
    'feat.cat.Market Strategy': 'Market Strategy',
    'feat.cat.Soil Science': 'Soil Science',
    'feat.cat.Water Management': 'Water Management',
    'feat.cat.Remote Sensing': 'Remote Sensing',
    'feat.free': 'Free Access',
    'feat.protected': 'Protected',
    'feat.simulate': 'Simulate Model →',

    // Platform Showcase (9.png)
    'showcase.mainTitle': 'End-to-End Farm Intelligence',
    'showcase.mainDesc':
      'Switch seamlessly between real-time weather alerts, satellite analytics, soil diagnostics, and mandi trade execution.',
    'showcase.tabWeather': 'Hyperlocal Weather',
    'showcase.tabSatellite': 'NDVI Satellite Scan',
    'showcase.tabSoil': 'Soil Intelligence',
    'showcase.tabMarket': 'Market Intelligence',

    // Weather Showcase
    'showcase.weather.tag': 'Precision Agronomy',
    'showcase.weather.title': 'AI-Powered Microclimate Forecasting',
    'showcase.weather.desc':
      'Pinpoint block-level weather forecasts calibrated with satellite telemetry and IoT sensor arrays. Get hyper-accurate spray windows and frost warnings up to 72 hours ahead.',
    'showcase.weather.chk1': 'Hourly farm-level humidity, wind vector, and dew point tracking',
    'showcase.weather.chk2': 'Dynamic spray advisory to eliminate pesticide drift and chemical runoff',
    'showcase.weather.chk3': 'Automated frost and heatwave surge alerts directly to your phone',
    'showcase.weather.btn': 'Explore in Dashboard →',

    // Satellite Showcase
    'showcase.satellite.tag': 'Orbital Remote Sensing Layer',
    'showcase.satellite.title': 'ESA Sentinel-2 Multispectral Surface Reflectance',
    'showcase.satellite.desc':
      'We ingest Band 4 (Red 665nm) and Band 8 (NIR 842nm) imagery every 5 days to compute NDVI and SAVI at 10-meter pixel resolution, pinpointing nitrogen deficiency corridors.',
    'showcase.satellite.chk1': 'Chlorophyll absorption detection across 84 micro-quadrants',
    'showcase.satellite.chk2': 'Atmospheric aerosol correction and automated cloud-masking',
    'showcase.satellite.chk3': 'Zero physical hardware required — 100% remote satellite geofencing',
    'showcase.satellite.btn': 'Launch AI Scan →',

    // Soil Showcase
    'showcase.soil.tag': 'Subsurface Telemetry Layer',
    'showcase.soil.title': 'Dielectric Moisture & N-P-K Chemistry Profiling',
    'showcase.soil.desc':
      'Continuous dielectric permittivity probes placed at 15cm and 30cm root depths transmit Volumetric Water Content (VWC) and Bulk EC to trigger automated drip fertigation.',
    'showcase.soil.chk1': 'Real-time rootzone water replenishment triggers',
    'showcase.soil.chk2': 'Salinity (EC) monitoring prevents toxic fertilizer salt accumulation',
    'showcase.soil.chk3': 'Hydraulic gradient sensing alerts before feeder root wilting',
    'showcase.soil.btn': 'Explore in Dashboard →',

    // Market Showcase
    'showcase.market.tag': 'Economic Arbitrage Engine',
    'showcase.market.title': 'APMC Live Modal Rates & Forward Storage Optimization',
    'showcase.market.desc':
      'Review observed mandi quotes, freight assumptions, and warehouse costs before making a sale decision.',
    'showcase.market.chk1': 'Automated diesel haulage deduction calculator',
    'showcase.market.chk2': 'WDRA warehouse storage vs spot sale arbitrage advisor',
    'showcase.market.chk3': 'Pledge loan interest subvention comparison (7% p.a.)',
    'showcase.market.btn': 'Compare Mandi Rates →',

    // CTA 1 (4.png)
    'cta1.badge': 'Free 30-Day AgTech Pilot',
    'cta1.title': 'Protect Your Harvest, Maximize Your Mandi Profits',
    'cta1.desc':
      'Use AgriSence field intelligence to reduce avoidable input waste, inspect pest risks early, and compare observed market quotes.',
    'cta1.btnStart': 'Get Started Now →',
    'cta1.btnDash': 'View Live Dashboard',
    'cta1.chk1': 'Zero Hardware Setup',
    'cta1.chk2': 'Instant Edge AI in Deep Fields',
    'cta1.chk3': 'Regional Dialects (Hindi, Marathi, Bengali, Telugu)',

    // CTA 2 (5.png)
    'cta2.badge': 'Ready For Smarter Harvests',
    'cta2.title': 'Transform Your Agricultural Yield with Intelligent Pest & Soil Protection',
    'cta2.desc':
      'Join thousands of modern cultivators using AgriSence for early infestation diagnosis, precision spraying, and verified mandi linkages.',
    'cta2.btnStart': 'Get Started Free →',
    'cta2.btnDash': 'Go to Dashboard',

    // Footer
    'footer.tagline': 'AI-Powered Precision Agriculture Platform for Indian Farmers',
    'footer.rights': 'All rights reserved. Dedicated to India’s farming community.',
  },

  hi: {
    // Navbar
    'nav.capabilities': 'प्लेटफ़ॉर्म क्षमताएं',
    'nav.outbreak': 'प्रकोप रडार',
    'nav.pestScan': 'एआई कीट जांच',
    'nav.arbitrage': 'मंडी भाव व लाभ',
    'nav.schemes': 'सरकारी योजनाएं',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.voiceAi': 'आवाज एआई (Voice)',
    'nav.signIn': 'लॉग इन करें',
    'nav.getStarted': 'शुरू करें',
    'nav.tickerTitle': 'एपीएमसी लाइव मंडी टिकर',

    // Hero
    'hero.badge': 'भारत के किसानों के लिए समर्पित आधुनिक एआई कृषि',
    'hero.title1': 'स्मार्ट खेती।',
    'hero.title2': 'उज्ज्वल भविष्य।',
    'hero.desc':
      'हर कृषि निर्णय के लिए संपूर्ण मंच — मौसम पूर्वानुमान, एआई कीट पहचान, 72 घंटे पूर्व प्रकोप चेतावनी, उपग्रह निगरानी, एपीएमसी मंडी भाव और सरकारी सब्सिडी। एग्रीसेंस पूरे कृषि तंत्र को एक सुंदर अनुभव में जोड़ता है।',
    'hero.btnDashboard': 'डैशबोर्ड खोलें →',
    'hero.btnPestScan': 'एआई कीट स्कैन',
    'hero.metric1': '98.4% सटीक एआई',
    'hero.metric2': '72 घंटे पूर्व चेतावनी',
    'hero.metric3': '24/7 कृषि सहायक',

    // Floating Cards
    'float.card1.loc': 'नागपुर, महाराष्ट्र',
    'float.card1.hum': '💧 62% नमी',
    'float.card1.wind': '🍃 12 किमी/घंटा',
    'float.card2.ai': 'एग्रीसेंस एआई',
    'float.card2.tag': 'कृषि सलाह',
    'float.card2.text': '15-25 जून के बीच सोयाबीन बोएं, 18% अधिक उपज पाएं।',
    'float.card4.mandi': 'सोयाबीन • नागपुर मंडी',

    // Stats
    'stats.s1.label': 'कीट पहचान सटीकता',
    'stats.s1.sub': '1 लाख+ क्षेत्रीय नमूनों पर परीक्षित',
    'stats.s2.label': 'लक्षित कीट प्रजातियां',
    'stats.s2.sub': 'भारतीय फसलों के प्रमुख रोग व कीट',
    'stats.s3.label': 'संरक्षित एकड़ भूमि',
    'stats.s3.sub': '14 कृषि-जलवायु क्षेत्रों में सक्रिय',
    'stats.s4.label': 'कीटनाशक खर्च में कमी',
    'stats.s4.sub': 'सटीक जैविक व वैज्ञानिक खुराक द्वारा',

    // Features Section
    'feat.tag': '20+ आधुनिक कृषि सिम्युलेटर व तकनीकें',
    'feat.title': 'सटीक कृषि व उन्नत कीट नियंत्रण',
    'feat.desc':
      'सूक्ष्म छिड़काव तकनीक, रासायनिक अनुकूलता, एपीएमसी भंडारण लाभ और उपग्रह विश्लेषण की संपूर्ण प्रणाली।',
    'feat.cat.All': 'सभी',
    'feat.cat.Diagnostics': 'रोग निदान',
    'feat.cat.Application Tech': 'छिड़काव तकनीक',
    'feat.cat.Chemical Safety': 'रासायनिक सुरक्षा',
    'feat.cat.Market Strategy': 'मंडी रणनीति',
    'feat.cat.Soil Science': 'मृदा विज्ञान',
    'feat.cat.Water Management': 'जल प्रबंधन',
    'feat.cat.Remote Sensing': 'उपग्रह निगरानी',
    'feat.free': 'निःशुल्क पहुंच',
    'feat.protected': 'संरक्षित',
    'feat.simulate': 'सिम्युलेटर खोलें →',

    // Platform Showcase (9.png)
    'showcase.mainTitle': 'संपूर्ण कृषि बुद्धिमत्ता (End-to-End Farm Intelligence)',
    'showcase.mainDesc':
      'सटीक मौसम अलर्ट, उपग्रह विश्लेषण, मृदा स्वास्थ्य और मंडी व्यापार का एक साथ अनुभव करें।',
    'showcase.tabWeather': 'स्थानीय मौसम',
    'showcase.tabSatellite': 'एनडीवीआई उपग्रह स्कैन',
    'showcase.tabSoil': 'मृदा बुद्धिमत्ता',
    'showcase.tabMarket': 'मंडी भाव व लाभ',

    'showcase.weather.tag': 'सटीक कृषि विज्ञान',
    'showcase.weather.title': 'एआई-संचालित स्थानीय मौसम पूर्वानुमान',
    'showcase.weather.desc':
      'उपग्रह और स्थानीय सेंसरों से कैलिब्रेटेड मौसम अनुमान। 72 घंटे पूर्व छिड़काव के अनुकूल समय और ओलावृष्टि चेतावनी पाएं।',
    'showcase.weather.chk1': 'प्रति घंटे नमी, हवा की गति और ओस बिंदु की सटीक निगरानी',
    'showcase.weather.chk2': 'दवा की बर्बादी रोकने के लिए सक्रिय छिड़काव परामर्श',
    'showcase.weather.chk3': 'शीतलहर और लू के खतरे की सीधी मोबाइल सूचना',
    'showcase.weather.btn': 'डैशबोर्ड में देखें →',

    'showcase.satellite.tag': 'कक्षीय उपग्रह निगरानी',
    'showcase.satellite.title': 'सेंटिनल-2 मल्टीस्पेक्ट्रल बायोमास परावर्तन',
    'showcase.satellite.desc':
      'हर 5 दिन में 10-मीटर रिज़ॉल्यूशन पर फसलों का एनडीवीआई विश्लेषण, ताकि पत्ते पीले पड़ने से पहले नाइट्रोजन की कमी पकड़ी जा सके।',
    'showcase.satellite.chk1': '84 माइक्रो-ज़ोन में क्लोरोफिल अवशोषण की जांच',
    'showcase.satellite.chk2': 'बादल और धूल से मुक्त सटीक उपग्रह चित्र',
    'showcase.satellite.chk3': 'बिना किसी हार्डवेयर के खेत की 100% सेटेलाइट मैपिंग',
    'showcase.satellite.btn': 'एआई स्कैन शुरू करें →',

    'showcase.soil.tag': 'जमीनी नमी व पोषण विश्लेषण',
    'showcase.soil.title': 'मृदा नमी व एन-पी-के पोषक तत्व प्रोफ़ाइल',
    'showcase.soil.desc':
      'जड़ों की 15 सेमी और 30 सेमी गहराई पर नमी और लवणता की निगरानी, जिससे ड्रिप सिंचाई का सटीक समय निर्धारित हो सके।',
    'showcase.soil.chk1': 'जड़ क्षेत्र में पानी की आवश्यकता का स्वतः आकलन',
    'showcase.soil.chk2': 'खारेपन से सुरक्षा हेतु विद्युत चालकता (EC) ट्रैकिंग',
    'showcase.soil.chk3': 'फसल की आवश्यकता अनुसार सटीक ड्रिप जल प्रबंधन',
    'showcase.soil.btn': 'डैशबोर्ड में देखें →',

    'showcase.market.tag': 'मंडी आर्थिक लाभ इंजन',
    'showcase.market.title': 'एपीएमसी लाइव भाव व वैज्ञानिक भंडारण लाभ',
    'showcase.market.desc':
      'अपने क्षेत्र के देखे गए मंडी भाव, परिवहन खर्च और भंडारण लागत की तुलना करें।',
    'showcase.market.chk1': 'डीजल ढुलाई खर्च घटाकर शुद्ध मुनाफे की गणना',
    'showcase.market.chk2': 'डब्ल्यूडीआरए गोदाम बनाम तुरंत बिक्री लाभ तुलना',
    'showcase.market.chk3': 'ई-एनडब्ल्यूआर गोदाम रसीद पर 7% ब्याज छूट की सुविधा',
    'showcase.market.btn': 'मंडी भाव तुलना करें →',

    // CTA 1 (4.png)
    'cta1.badge': 'निःशुल्क 30-दिवसीय कृषि पायलट',
    'cta1.title': 'अपनी फसल सुरक्षित करें, मंडी से पाएं सर्वाधिक मुनाफा',
    'cta1.desc':
      'इनपुट की अनावश्यक बर्बादी कम करने और देखे गए बाजार भाव की तुलना करने के लिए AgriSence का उपयोग करें।',
    'cta1.btnStart': 'अभी शुरू करें →',
    'cta1.btnDash': 'लाइव डैशबोर्ड देखें',
    'cta1.chk1': 'बिना किसी हार्डवेयर सेटअप के',
    'cta1.chk2': 'गहरे खेतों में भी त्वरित AI निदान',
    'cta1.chk3': 'क्षेत्रीय भाषाएं (हिंदी, मराठी, बंगाली, तेलुगु)',

    // CTA 2 (5.png)
    'cta2.badge': 'स्मार्ट फसल सुरक्षा के लिए तैयार',
    'cta2.title': 'सटीक कीट व मृदा संरक्षण के साथ बढ़ाएं अपनी उपज',
    'cta2.desc':
      'शुरुआती संक्रमण पहचान, संतुलित छिड़काव और प्रमाणित मंडी संपर्कों के लिए हजारों प्रगतिशील किसानों के साथ जुड़ें।',
    'cta2.btnStart': 'फ्री में शुरू करें →',
    'cta2.btnDash': 'डैशबोर्ड पर जाएं',

    // Footer
    'footer.tagline': 'भारतीय किसानों के लिए एआई-संचालित आधुनिक कृषि मंच',
    'footer.rights': 'सर्वाधिकार सुरक्षित। भारत के अन्नदाताओं को समर्पित।',
  },

  mr: {
    // Navbar
    'nav.capabilities': 'प्लॅटफॉर्म वैशिष्ट्ये',
    'nav.outbreak': 'रोगप्रसार रडार',
    'nav.pestScan': 'एआय कीड तपासणी',
    'nav.arbitrage': 'बाजारभाव व नफा',
    'nav.schemes': 'शासकीय योजना',
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.voiceAi': 'व्हॉईस एआय (Voice)',
    'nav.signIn': 'साइन इन करा',
    'nav.getStarted': 'सुरुवात करा',
    'nav.tickerTitle': 'एपीएमसी थेट बाजारभाव टिकर',

    // Hero
    'hero.badge': 'महाराष्ट्रातील व भारतीय शेतकऱ्यांसाठी प्रगत कृषी एआय',
    'hero.title1': 'स्मार्ट शेती.',
    'hero.title2': 'उज्ज्वल भविष्य.',
    'hero.desc':
      'शेतीच्या प्रत्येक निर्णयासाठी एकच विश्वासू प्लॅटफॉर्म — हवामान अंदाज, एआय कीड निदान, ७२ तास आधी कीड चेतावणी, उपग्रह निरीक्षण, थेट बाजारभाव आणि शासकीय योजना. ॲग्रीसेन्स संपूर्ण शेती व्यवस्था एका सोप्या अनुभवात आणते.',
    'hero.btnDashboard': 'डॅशबोर्ड उघडा →',
    'hero.btnPestScan': 'एआय कीड स्कॅन',
    'hero.metric1': '९८.४% अचूक एआय',
    'hero.metric2': '७२ तास आधी चेतावणी',
    'hero.metric3': '२४/७ कृषी मित्र',

    // Floating Cards
    'float.card1.loc': 'नागपूर, महाराष्ट्र',
    'float.card1.hum': '💧 ६२% आर्द्रता',
    'float.card1.wind': '🍃 १२ किमी/तास',
    'float.card2.ai': 'ॲग्रीसेन्स एआय',
    'float.card2.tag': 'कृषी सल्ला',
    'float.card2.text': 'सोयाबीनची पेरणी १५ ते २५ जून दरम्यान करा, १८% जास्त उत्पादन मिळवा.',
    'float.card4.mandi': 'सोयाबीन • नागपूर मंडी',

    // Stats
    'stats.s1.label': 'कीड ओळख अचूकता',
    'stats.s1.sub': '१ लाख+ प्रत्यक्ष नमुन्यांवर आधारित',
    'stats.s2.label': 'लक्षित कीड प्रजाती',
    'stats.s2.sub': 'भारतीय पिकांवरील प्रमुख कीड व रोग',
    'stats.s3.label': 'संरक्षित एकर क्षेत्र',
    'stats.s3.sub': '१४ कृषी-हवामान पट्ट्यांमध्ये कार्यरत',
    'stats.s4.label': 'औषध खर्चात बचत',
    'stats.s4.sub': 'अचूक जैविक आणि रासायनिक प्रमाणाने',

    // Features Section
    'feat.tag': '२०+ प्रगत कृषी सिम्युलेटर व साधने',
    'feat.title': 'अचूक कृषी नियोजन व कीड नियंत्रण',
    'feat.desc':
      'फवारणी वेळ नियोजन, रासायनिक सुसंगतता, गोदामातील साठवणूक नफा आणि उपग्रह विश्लेषणाची एकात्मिक व्यवस्था.',
    'feat.cat.All': 'सर्व',
    'feat.cat.Diagnostics': 'रोगनिदान',
    'feat.cat.Application Tech': 'फवारणी तंत्रज्ञान',
    'feat.cat.Chemical Safety': 'रासायनिक सुरक्षा',
    'feat.cat.Market Strategy': 'बाजारपेठ धोरण',
    'feat.cat.Soil Science': 'मृदा विज्ञान',
    'feat.cat.Water Management': 'पाणी व्यवस्थापन',
    'feat.cat.Remote Sensing': 'उपग्रह तंत्रज्ञान',
    'feat.free': 'मोफत प्रवेश',
    'feat.protected': 'सुरक्षित',
    'feat.simulate': 'सिम्युलेटर चालवा →',

    // Platform Showcase (9.png)
    'showcase.mainTitle': 'संपूर्ण शेती बुद्धिमत्ता (End-to-End Farm Intelligence)',
    'showcase.mainDesc':
      'थेट हवामान अंदाज, उपग्रह विश्लेषण, माती परीक्षण आणि बाजारभाव जोडणीचा अखंड अनुभव घ्या.',
    'showcase.tabWeather': 'स्थानिक हवामान',
    'showcase.tabSatellite': 'उपग्रह एनडीव्हीआय स्कॅन',
    'showcase.tabSoil': 'माती परीक्षण व पोषण',
    'showcase.tabMarket': 'बाजारभाव व नफा',

    'showcase.weather.tag': 'प्रिसिजन ॲग्रोनॉमी',
    'showcase.weather.title': 'एआय-सक्षम स्थानिक हवामान अंदाज',
    'showcase.weather.desc':
      'उपग्रह आणि सेन्सर्सच्या साहाय्याने तयार केलेला अचूक अंदाज. ७२ तास आधी फवारणीचा सुरक्षित वेळ आणि थंडीची चेतावणी मिळवा.',
    'showcase.weather.chk1': 'तासनिहाय आर्द्रता, वाऱ्याचा वेग आणि दवबिंदू निरीक्षण',
    'showcase.weather.chk2': 'फवारणी वाहून जाणे रोखण्यासाठी अचूक वेळ सल्ला',
    'showcase.weather.chk3': 'अचानक थंडी किंवा उष्माघाताची थेट मोबाईल सूचना',
    'showcase.weather.btn': 'डॅशबोर्डमध्ये पहा →',

    'showcase.satellite.tag': 'उपग्रह रिमोट सेन्सिंग थर',
    'showcase.satellite.title': 'सेंटिनेल-२ पिकांचे उपग्रह निरीक्षण',
    'showcase.satellite.desc':
      'दर ५ दिवसांनी १०-मीटर क्षमतेचे उपग्रह फोटो वापरून बायोमास व क्लोरोफिल तपासणी केली जाते, ज्यामुळे पिवळेपणा आधीच समजतो.',
    'showcase.satellite.chk1': '८४ भागांमध्ये क्लोरोफिल घनतेची अचूक तपासणी',
    'showcase.satellite.chk2': 'ढगाळ वातावरण बाजूला करून स्पष्ट उपग्रह माहिती',
    'showcase.satellite.chk3': 'कोणत्याही उपकरणाशिवाय १००% रिमोट शेती मॅपिंग',
    'showcase.satellite.btn': 'एआय स्कॅन उघडा →',

    'showcase.soil.tag': 'मातीतील ओलावा व पोषण थर',
    'showcase.soil.title': 'मातीची आर्द्रता व एन-पी-के पोषण पातळी',
    'showcase.soil.desc':
      'पिकांच्या मुळाशी १५ व ३० सेमी खोलीवर ओलावा तपासून ठिबक सिंचनाची वेळ आणि प्रमाण आपोआप ठरवले जाते.',
    'showcase.soil.chk1': 'मुळांना आवश्यक पाण्याचा अचूक अंदाज',
    'showcase.soil.chk2': 'क्षारांचे प्रमाण मोजून मातीचे आरोग्य राखणे',
    'showcase.soil.chk3': 'पिकांच्या गरजेनुसार ठिबक पाण्याचे अचूक नियोजन',
    'showcase.soil.btn': 'डॅशबोर्डमध्ये पहा →',

    'showcase.market.tag': 'बाजारभाव आर्थिक नफा मॉडेल',
    'showcase.market.title': 'एपीएमसी थेट बाजारभाव व साठवणूक नफा सल्ला',
    'showcase.market.desc':
      '२,४००+ बाजार समित्यांमधील थेट दर. वाहतूक खर्च वजा जाता माल त्वरित विकायचा की गोदामात ठेवायचा, याचा नफा सल्ला मिळतो.',
    'showcase.market.chk1': 'वाहतूक खर्च वजा करून निव्वळ नफ्याचे गणित',
    'showcase.market.chk2': 'वखार महामंडळ गोदामातील साठवणुकीचा निव्वळ नफा',
    'showcase.market.chk3': 'गोदाम पावतीवर ७% सवलतीच्या व्याजदराने कर्ज सुविधा',
    'showcase.market.btn': 'बाजारभाव तुलना करा →',

    // CTA 1 (4.png)
    'cta1.badge': 'मोफत ३०-दिवसीय कृषी पायलट',
    'cta1.title': 'आपले पीक वाचवा, बाजारपेठेतून मिळवा जास्तीत जास्त नफा',
    'cta1.desc':
      'रासायनिक खते-औषधांचा अतिरिक्त खर्च टाळण्यासाठी, ४८ तास आधी कीड संकट ओळखण्यासाठी ४५,०००+ शेतकऱ्यांसोबत सामील व्हा.',
    'cta1.btnStart': 'आता सुरू करा →',
    'cta1.btnDash': 'थेट डॅशबोर्ड पहा',
    'cta1.chk1': 'कोणत्याही उपकरणाची गरज नाही',
    'cta1.chk2': 'खेड्यापाड्यातही झटपट AI निदान',
    'cta1.chk3': 'प्रादेशिक भाषा (मराठी, हिंदी, बंगाली, तेलगू)',

    // CTA 2 (5.png)
    'cta2.badge': 'स्मार्ट शेतीसाठी सज्ज व्हा',
    'cta2.title': 'माती आणि पिकांचे अचूक संरक्षण करून उत्पादन वाढवा',
    'cta2.desc':
      'प्राथमिक अवस्थेत कीड ओळख, संतुलित फवारणी आणि हमखास बाजारपेठ जोडणीसाठी हजारो शेतकऱ्यांसोबत या.',
    'cta2.btnStart': 'मोफत सुरुवात करा →',
    'cta2.btnDash': 'डॅशबोर्डवर जा',

    // Footer
    'footer.tagline': 'भारतीय शेतकरी बांधवांसाठी एआय-सक्षम स्मार्ट कृषी व्यासपीठ',
    'footer.rights': 'सर्व हक्क राखीव. बळीराजाला सस्नेह समर्पित.',
  },

  bn: {
    // Navbar
    'nav.capabilities': 'প্ল্যাটফর্ম বৈশিষ্ট্য',
    'nav.outbreak': 'মহামারী রাডার',
    'nav.pestScan': 'এআই পোকা সনাক্তকরণ',
    'nav.arbitrage': 'মান্ডি দর ও লাভ',
    'nav.schemes': 'সরকারি প্রকল্প',
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.voiceAi': 'ভয়েস এআই (Voice)',
    'nav.signIn': 'সাইন ইন',
    'nav.getStarted': 'শুরু করুন',
    'nav.tickerTitle': 'এপিএমসি লাইভ মান্ডি টিকার',

    // Hero
    'hero.badge': 'ভারতীয় কৃষকদের জন্য এআই-চালিত উন্নত প্রযুক্তি',
    'hero.title1': 'স্মার্ট চাষবাস।',
    'hero.title2': 'উন্নত ভবিষ্যৎ।',
    'hero.desc':
      'চাষের প্রতিটি সিদ্ধান্তের সম্পূর্ণ সমাধান — আবহাওয়া পূর্বাভাস, এআই রোগ নির্ণয়, ৭২ ঘণ্টা আগে পোকার আক্রমণ সতর্কতা, উপগ্রহ পর্যবেক্ষণ, মান্ডি দর ও সরকারি অনুদান। এগ্রিসেন্স কৃষির সবকিছু এক ছাদের তলায় এনেছে।',
    'hero.btnDashboard': 'ড্যাশবোর্ড খুলুন →',
    'hero.btnPestScan': 'এআই পেস্ট স্ক্যান',
    'hero.metric1': '৯৮.৪% নির্ভুল এআই',
    'hero.metric2': '৭২ ঘণ্টা পূর্বে সতর্কতা',
    'hero.metric3': '২৪/৭ কৃষি বন্ধু',

    // Floating Cards
    'float.card1.loc': 'বর্ধমান, পশ্চিমবঙ্গ',
    'float.card1.hum': '💧 ৬২% আর্দ্রতা',
    'float.card1.wind': '🍃 ১২ কিমি/ঘণ্টা',
    'float.card2.ai': 'এগ্রিসেন্স এআই',
    'float.card2.tag': 'কৃষি পরামর্শ',
    'float.card2.text': '১৫-২৫ জুনের মধ্যে ধান রোপণ করুন, ১৮% অধিক ফলন পাবেন।',
    'float.card4.mandi': 'ধান • শিলিগুড়ি মান্ডি',

    // Stats
    'stats.s1.label': 'পোকা সনাক্তকরণের নির্ভুলতা',
    'stats.s1.sub': '১ লক্ষের বেশি মাঠের নমুনায় পরীক্ষিত',
    'stats.s2.label': 'লক্ষিত ক্ষতিকর পোকা',
    'stats.s2.sub': 'ভারতীয় ফসলের রোগ ও কীটতত্ত্ব',
    'stats.s3.label': 'সুরক্ষিত একর জমি',
    'stats.s3.sub': '১৪টি কৃষি-আবহাওয়া অঞ্চলে সক্রিয়',
    'stats.s4.label': 'কীটনাশক খরচ হ্রাস',
    'stats.s4.sub': 'সঠিক জৈব ও রাসায়নিক মাত্রার প্রয়োগে',

    // Features Section
    'feat.tag': '২০+ নির্ভুল কৃষি সিমুলেটর ও ক্ষমতা',
    'feat.title': 'উন্নত রোগ নিয়ন্ত্রণ ও নির্ভুল কৃষি',
    'feat.desc':
      'স্প্রে সময় পরিকল্পনা, রাসায়নিক সামঞ্জস্য, মান্ডি গুদাম লাভ ও উপগ্রহ বিশ্লেষণের সমন্বিত প্রযুক্তি।',
    'feat.cat.All': 'সব',
    'feat.cat.Diagnostics': 'রোগ নির্ণয়',
    'feat.cat.Application Tech': 'স্প্রে প্রযুক্তি',
    'feat.cat.Chemical Safety': 'রাসায়নিক নিরাপত্তা',
    'feat.cat.Market Strategy': 'বাজার কৌশল',
    'feat.cat.Soil Science': 'মৃত্তিকা বিজ্ঞান',
    'feat.cat.Water Management': 'জল ব্যবস্থাপনা',
    'feat.cat.Remote Sensing': 'স্যাটেলাইট পর্যবেক্ষণ',
    'feat.free': 'বিনামূল্যে অ্যাক্সেস',
    'feat.protected': 'সুরক্ষিত',
    'feat.simulate': 'মডেল সিমুলেট করুন →',

    // Platform Showcase (9.png)
    'showcase.mainTitle': 'সম্পূর্ণ মাঠের তথ্য বুদ্ধিমত্তা (End-to-End Farm Intelligence)',
    'showcase.mainDesc':
      'আবহাওয়া সতর্কতা, স্যাটেলাইট বিশ্লেষণ, মাটির স্বাস্থ্য এবং মান্ডি ট্রেডের নিরবচ্ছিন্ন অভিজ্ঞতা নিন।',
    'showcase.tabWeather': 'হাইপারলোকাল আবহাওয়া',
    'showcase.tabSatellite': 'উপগ্রহ এনডিভিআই স্ক্যান',
    'showcase.tabSoil': 'মাটির বুদ্ধিমত্তা',
    'showcase.tabMarket': 'মান্ডি বাজার বিশ্লেষণ',

    'showcase.weather.tag': 'নির্ভুল কৃষিবিজ্ঞান',
    'showcase.weather.title': 'এআই-চালিত স্থানীয় আবহাওয়ার পূর্বাভাস',
    'showcase.weather.desc':
      'স্যাটেলাইট ও সেন্সরের সাথে মেলানো পূর্বাভাস। ৭২ ঘণ্টা আগে নিখুঁত স্প্রে করার সময় ও ঝড়-বৃষ্টির সতর্কতা পান।',
    'showcase.weather.chk1': 'প্রতি ঘণ্টার আর্দ্রতা, বাতাসের বেগ ও শিশিরবিন্দু ট্র্যাকিং',
    'showcase.weather.chk2': 'ওষুধের অপচয় রোধে কার্যকর স্প্রে পরামর্শ',
    'showcase.weather.chk3': 'হঠাৎ শৈত্যপ্রবাহ বা দাবদাহের সরাসরি মোবাইল সতর্কতা',
    'showcase.weather.btn': 'ড্যাশবোর্ডে দেখুন →',

    'showcase.satellite.tag': 'স্যাটেলাইট পর্যবেক্ষণ স্তর',
    'showcase.satellite.title': 'সেন্টিনেল-২ ফসলের বায়োমাস প্রতিফলন',
    'showcase.satellite.desc':
      'প্রতি ৫ দিনে ১০-মিটার রেজোলিউশনে ফসলের পাতার ক্লোরোফিল ও জলের মাত্রা বিশ্লেষণ করে অপুষ্টি আগেই ধরা যায়।',
    'showcase.satellite.chk1': '৮৪টি অংশে ক্লোরোফিল শোষণের সঠিক পরীক্ষা',
    'showcase.satellite.chk2': 'মেঘ ও ধোঁয়াশামুক্ত পরিষ্কার উপগ্রহ ছবি',
    'showcase.satellite.chk3': 'কোনো অতিরিক্ত যন্ত্র ছাড়াই ১০০% স্যাটেলাইট ম্যাপিং',
    'showcase.satellite.btn': 'এআই স্ক্যান শুরু করুন →',

    'showcase.soil.tag': 'মাটির আর্দ্রতা ও পুষ্টি স্তর',
    'showcase.soil.title': 'মাটির আর্দ্রতা ও এন-পি-কে পুষ্টি উপাদান',
    'showcase.soil.desc':
      'শিকড়ের ১৫ ও ৩০ সেমি গভীরে আর্দ্রতা পরীক্ষা করে ড্রিপ সেচের পরিমাণ স্বয়ংক্রিয়ভাবে গণনা করা হয়।',
    'showcase.soil.chk1': 'শিকড়ে প্রয়োজনীয় জলের সঠিক পূর্বাভাস',
    'showcase.soil.chk2': 'লবণাক্ততা নিয়ন্ত্রণ করে মাটির উর্বরতা বৃদ্ধি',
    'showcase.soil.chk3': 'পানির অপচয় রুখে ড্রিপ সেচের বৈজ্ঞানিক সময়',
    'showcase.soil.btn': 'ড্যাশবোর্ডে দেখুন →',

    'showcase.market.tag': 'মান্ডি অর্থনৈতিক লাভ ইঞ্জিন',
    'showcase.market.title': 'এপিএমসি লাইভ মান্ডি দর ও গুদামজাতকরণ লাভ',
    'showcase.market.desc':
      '২,৪০০+ মান্ডির লাইভ দর। পরিবহন খরচ বাদ দিয়ে ফসল এখনই বিক্রি করবেন না গুদামে রেখে কুইন্টালে ₹১৮০-৫৫০ বেশি পাবেন, তার পরামর্শ।',
    'showcase.market.chk1': 'পরিবহন খরচ বাদ দিয়ে আসল লাভের হিসাব',
    'showcase.market.chk2': 'গুদামে মজুত বনাম অবিলম্বে বিক্রির সঠিক লাভ',
    'showcase.market.chk3': 'গুদাম রসিদে ৭% সুদে কৃষি ঋণের সহায়তা',
    'showcase.market.btn': 'মান্ডি দর তুলনা করুন →',

    // CTA 1 (4.png)
    'cta1.badge': 'বিনামূল্যে ৩০-দিনের এগ্রিটেক ট্রায়াল',
    'cta1.title': 'ফসল রক্ষা করুন, মান্ডি থেকে সর্বাধিক লাভ পান',
    'cta1.desc':
      'অতিরিক্ত ওষুধের খরচ কমাতে, ৪৮ ঘণ্টা আগে রোগ ধরতে এবং সর্বোচ্চ দাম নিশ্চিত করতে ৪৫,০০০+ কৃষকের সাথে যোগ দিন।',
    'cta1.btnStart': 'এখনই শুরু করুন →',
    'cta1.btnDash': 'লাইভ ড্যাশবোর্ড দেখুন',
    'cta1.chk1': 'কোনো অতিরিক্ত হার্ডওয়্যার ছাড়াই',
    'cta1.chk2': 'গভীর মাঠেও তাৎক্ষণিক AI নির্ণয়',
    'cta1.chk3': 'আঞ্চলিক ভাষা (বাংলা, হিন্দি, মারাঠি, তেলুগু)',

    // CTA 2 (5.png)
    'cta2.badge': 'স্মার্ট চাষের জন্য প্রস্তুত হন',
    'cta2.title': 'সঠিক কীট ও মাটি সুরক্ষায় ফলন বহুগুণ বাড়ান',
    'cta2.desc':
      'প্রাথমিক রোগ ধরা, সুষম স্প্রে এবং নিশ্চিত মান্ডি সংযোগের মাধ্যমে হাজার হাজার কৃষকের সাথে এগিয়ে যান।',
    'cta2.btnStart': 'ফ্রি তে শুরু করুন →',
    'cta2.btnDash': 'ড্যাশবোর্ডে যান',

    // Footer
    'footer.tagline': 'ভারতীয় কৃষকদের জন্য এআই-চালিত নির্ভুল কৃষি প্ল্যাটফর্ম',
    'footer.rights': 'সর্বস্বত্ব সংরক্ষিত। বাংলার ও ভারতের কৃষকদের প্রতি উৎসর্গীকৃত।',
  },

  te: {
    // Navbar
    'nav.capabilities': 'ప్లాట్‌ఫారమ్ ఫీచర్లు',
    'nav.outbreak': 'తెగుళ్ల రాడార్',
    'nav.pestScan': 'ఏఐ తెగుళ్ల స్కాన్',
    'nav.arbitrage': 'మార్కెట్ ధరలు & లాభం',
    'nav.schemes': 'ప్రభుత్వ పథకాలు',
    'nav.dashboard': 'డాష్‌బోర్డ్',
    'nav.voiceAi': 'వాయిస్ ఏఐ (Voice)',
    'nav.signIn': 'లాగిన్',
    'nav.getStarted': 'ప్రారంభించండి',
    'nav.tickerTitle': 'ఏపీఎంసీ లైవ్ మార్కెట్ టిక్కర్',

    // Hero
    'hero.badge': 'భారతీయ రైతుల కోసం రూపొందించిన ఆధునిక ఏఐ',
    'hero.title1': 'స్మార్ట్ వ్యవసాయం.',
    'hero.title2': 'ఉజ్వల భవిష్యత్తు.',
    'hero.desc':
      'వ్యవసాయ నిర్ణయాలన్నింటికీ ఒకే సమగ్ర వేదిక — వాతావరణం, తెగుళ్ల గుర్తింపు, 72 గంటల ముందస్తు హెచ్చరికలు, ఉపగ్రహ పర్యవేక్షణ, మార్కెట్ ధరలు మరియు సబ్సిడీలు.',
    'hero.btnDashboard': 'డ్యాష్‌బోర్డ్ తెరవండి →',
    'hero.btnPestScan': 'ఏఐ తెగుళ్ల స్కాన్',
    'hero.metric1': '98.4% ఏఐ ఖచ్చితత్వం',
    'hero.metric2': '72 గంటల ముందస్తు హెచ్చరిక',
    'hero.metric3': '24/7 వ్యవసాయ సహాయకుడు',

    // Floating Cards
    'float.card1.loc': 'వరంగల్, తెలంగాణ',
    'float.card1.hum': '💧 62% తేమ',
    'float.card1.wind': '🍃 12 కిమీ/గం',
    'float.card2.ai': 'అగ్రిసెన్స్ ఏఐ',
    'float.card2.tag': 'వ్యవసాయ సలహా',
    'float.card2.text': 'జూన్ 15-25 మధ్య సోయాబీన్ విత్తండి, 18% ఎక్కువ దిగుబడి పొందండి.',
    'float.card4.mandi': 'సోయాబీన్ • వరంగల్ మార్కెట్',

    // Stats
    'stats.s1.label': 'తెగుళ్ల గుర్తింపు ఖచ్చితత్వం',
    'stats.s1.sub': '1 లక్షకు పైగా పొలం నమూనాలపై పరీక్షించబడింది',
    'stats.s2.label': 'లక్ష్యిత తెగుళ్ల రకాలు',
    'stats.s2.sub': 'భారతీయ పంటల తెగుళ్లు మరియు వ్యాధులు',
    'stats.s3.label': 'రక్షించబడిన ఎకరాల విస్తీర్ణం',
    'stats.s3.sub': '14 వ్యవసాయ వాతావరణ మండలాలలో విస్తరణ',
    'stats.s4.label': 'మందుల ఖర్చులో ఆదా',
    'stats.s4.sub': 'ఖచ్చితమైన సేంద్రీయ మోతాదు ద్వారా',

    // Features Section
    'feat.tag': '20+ వ్యవసాయ సిమ్యులేటర్లు & సామర్థ్యాలు',
    'feat.title': 'తెగుళ్ల నివారణ & ఆధునిక వ్యవసాయం',
    'feat.desc':
      'స్ప్రే సమయ ప్రణాళిక, రసాయనాల అనుకూలత, మార్కెట్ నిల్వ లాభాలు మరియు ఉపగ్రహ విశ్లేషణల సమగ్ర వేదిక.',
    'feat.cat.All': 'అన్నీ',
    'feat.cat.Diagnostics': 'రోగనిర్ధారణ',
    'feat.cat.Application Tech': 'స్ప్రే టెక్నాలజీ',
    'feat.cat.Chemical Safety': 'రసాయన భద్రత',
    'feat.cat.Market Strategy': 'మార్కెట్ వ్యూహం',
    'feat.cat.Soil Science': 'నేల విజ్ఞానం',
    'feat.cat.Water Management': 'నీటి యాజమాన్యం',
    'feat.cat.Remote Sensing': 'ఉపగ్రహ పర్యవేక్షణ',
    'feat.free': 'ఉచిత సేవ',
    'feat.protected': 'రక్షిత',
    'feat.simulate': 'సిమ్యులేట్ చేయండి →',

    // Platform Showcase (9.png)
    'showcase.mainTitle': 'ఎండ్-టు-ఎండ్ వ్యవసాయ సమాచారం (End-to-End Farm Intelligence)',
    'showcase.mainDesc':
      'వాతావరణ హెచ్చరికలు, ఉపగ్రహ విశ్లేషణ, నేల పరీక్ష మరియు మార్కెట్ ధరలను ఒకే వేదికపై వీక్షించండి.',
    'showcase.tabWeather': 'స్థానిక వాతావరణం',
    'showcase.tabSatellite': 'ఉపగ్రహ NDVI స్కాన్',
    'showcase.tabSoil': 'నేల సమాచారం',
    'showcase.tabMarket': 'మార్కెట్ సమాచారం',

    'showcase.weather.tag': 'ప్రెసిషన్ అగ్రోనమీ',
    'showcase.weather.title': 'ఏఐ ఆధారిత సూక్ష్మ వాతావరణ అంచనా',
    'showcase.weather.desc':
      'ఉపగ్రహాలు మరియు సెన్సార్లతో సరిపోల్చిన అంచనా. 72 గంటల ముందుగానే స్ప్రే సమయం మరియు వాతావరణ హెచ్చరికలు పొందండి.',
    'showcase.weather.chk1': 'గంటల వారీగా తేమ, గాలి వేగం మరియు మంచు బిందువు నమోదు',
    'showcase.weather.chk2': 'మందుల వృథా కాకుండా సరైన స్ప్రే సమయ సలహాలు',
    'showcase.weather.chk3': 'తీవ్ర ఎండలు లేదా తుఫాను హెచ్చరికలు నేరుగా ఫోన్‌కు',
    'showcase.weather.btn': 'డ్యాష్‌బోర్డ్‌లో చూడండి →',

    'showcase.satellite.tag': 'ఉపగ్రహ పర్యవేక్షణ',
    'showcase.satellite.title': 'సెంటినెల్-2 పంట పచ్చదనం విశ్లేషణ',
    'showcase.satellite.desc':
      'ప్రతి 5 రోజులకు ఒకసారి ఉపగ్రహ ఛాయాచిత్రాల ద్వారా పోషకాల లోపాన్ని ముందే గుర్తించవచ్చు.',
    'showcase.satellite.chk1': '84 ప్రాంతాలలో క్లోరోఫిల్ స్థాయిల పరిశీలన',
    'showcase.satellite.chk2': 'మేఘాలు లేకుండా స్పష్టమైన ఉపగ్రహ చిత్రాలు',
    'showcase.satellite.chk3': 'పరికరాలు లేకుండా 100% ఆన్‌లైన్ శాటిలైట్ మ్యాపింగ్',
    'showcase.satellite.btn': 'ఏఐ స్కాన్ ప్రారంభించండి →',

    'showcase.soil.tag': 'నేల తేమ & పోషకాలు',
    'showcase.soil.title': 'నేల తేమ మరియు N-P-K సమతుల్యత',
    'showcase.soil.desc':
      'వేర్ల వద్ద 15 సెం.మీ మరియు 30 సెం.మీ లోతులో తేమను బట్టి బిందు సేద్యం సమయాన్ని లెక్కిస్తుంది.',
    'showcase.soil.chk1': 'వేర్లకు అవసరమైన నీటి పరిమాణ అంచనా',
    'showcase.soil.chk2': 'ఉప్పు నిల్వలు పెరగకుండా నేల ఆరోగ్యం రక్షణ',
    'showcase.soil.chk3': 'నీటి వృథా లేకుండా డ్రిప్ సరైన సమయ నిర్ధారణ',
    'showcase.soil.btn': 'డ్యాష్‌బోర్డ్‌లో చూడండి →',

    'showcase.market.tag': 'మార్కెట్ లాభాల నమూనా',
    'showcase.market.title': 'మార్కెట్ ధరలు & నిల్వ లాభాల విశ్లేషణ',
    'showcase.market.desc':
      'మీ ప్రాంతంలో గమనించిన మార్కెట్ ధరలు, రవాణా ఖర్చు మరియు నిల్వ ఖర్చులను పరిశీలించండి.',
    'showcase.market.chk1': 'రవాణా ఖర్చులను మినహాయించి నికర లాభం లెక్కింపు',
    'showcase.market.chk2': 'వేర్‌హౌస్ నిల్వ ద్వారా లభించే అదనపు ఆదాయం',
    'showcase.market.chk3': 'రసీదుపై 7% వడ్డీ రాయితీతో పంట రుణాలు',
    'showcase.market.btn': 'మార్కెట్ ధరలు పోల్చండి →',

    // CTA 1 & 2
    'cta1.badge': 'ఉచిత 30-రోజుల అగ్రిటెక్ ట్రయల్',
    'cta1.title': 'పంటను కాపాడుకోండి, మార్కెట్ ద్వారా అధిక లాభం పొందండి',
    'cta1.desc': 'మీ పంట రికార్డులు మరియు గమనించిన మార్కెట్ ధరలను అర్థం చేసుకోవడానికి AgriSence ఉపయోగించండి.',
    'cta1.btnStart': 'ఇప్పుడే ప్రారంభించండి →',
    'cta1.btnDash': 'డ్యాష్‌బోర్డ్ చూడండి',
    'cta1.chk1': 'హార్డ్‌వేర్ పరికరాలు అవసరం లేదు',
    'cta1.chk2': 'పొలాల్లో తక్షణ AI నిర్ధారణ',
    'cta1.chk3': 'ప్రాంతీయ భాషలు (తెలుగు, హిందీ, మరాఠీ, బెంగాలీ)',

    'cta2.badge': 'స్మార్ట్ పంటల కోసం సిద్ధం కాండి',
    'cta2.title': 'ఖచ్చితమైన తెగుళ్ల నివారణతో మీ పంట దిగుబడిని పెంచండి',
    'cta2.desc': 'ఆధునిక సాంకేతికతతో వేలాది మంది రైతులతో కలిసి ముందుకు సాగండి.',
    'cta2.btnStart': 'ఉచితంగా ప్రారంభించండి →',
    'cta2.btnDash': 'డ్యాష్‌బోర్డ్‌కి వెళ్లండి',

    'footer.tagline': 'రైతుల కోసం ఏఐ ఆధారిత స్మార్ట్ వ్యవసాయ వేదిక',
    'footer.rights': 'సర్వహక్కులు ప్రత్యేకించబడ్డాయి. అన్నదాతలకు అంకితం.',
  },

  ta: {
    // Navbar
    'nav.capabilities': 'தளத்தின் சிறப்பம்சங்கள்',
    'nav.outbreak': 'பூச்சி தாக்குதல் ரேடார்',
    'nav.pestScan': 'AI பூச்சி ஸ்கேன்',
    'nav.arbitrage': 'மண்டி விலை மற்றும் லாபம்',
    'nav.schemes': 'அரசு மானியங்கள்',
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.voiceAi': 'குரல் AI (Voice)',
    'nav.signIn': 'உள்நுழைக',
    'nav.getStarted': 'தொடங்குங்கள்',
    'nav.tickerTitle': 'நேரலை சந்தை விலை நிலவரம்',

    // Hero
    'hero.badge': 'இந்திய விவசாயிகளுக்கான செயற்கை நுண்ணறிவு',
    'hero.title1': 'திறன்மிகு விவசாயம்.',
    'hero.title2': 'சிறந்த எதிர்காலம்.',
    'hero.desc':
      'விவசாய முடிவுகளுக்கான முழுமையான தளம் — வானிலை, பூச்சி நோய் கண்டறிதல், 72 மணி நேர முன்னறிவிப்பு, செயற்கைக்கோள் கண்காணிப்பு மற்றும் சந்தை விலைகள்.',
    'hero.btnDashboard': 'டாஷ்போர்டு திறக்க →',
    'hero.btnPestScan': 'AI பூச்சி ஸ்கேன்',
    'hero.metric1': '98.4% AI துல்லியம்',
    'hero.metric2': '72 மணி நேர எச்சரிக்கை',
    'hero.metric3': '24/7 விவசாய தோழன்',

    // Floating Cards
    'float.card1.loc': 'மதுரை, தமிழ்நாடு',
    'float.card1.hum': '💧 62% ஈரப்பதம்',
    'float.card1.wind': '🍃 12 கிமீ/மணி',
    'float.card2.ai': 'அக்ரிசென்ஸ் AI',
    'float.card2.tag': 'விவசாய ஆலோசனை',
    'float.card2.text': 'சரியான நேரத்தில் விதைத்து 18% கூடுதல் விளைச்சல் பெறுங்கள்.',
    'float.card4.mandi': 'நெல் • மதுரை மண்டி',

    // Stats
    'stats.s1.label': 'பூச்சி கண்டறிதல் துல்லியம்',
    'stats.s1.sub': '1 லட்சத்திற்கும் மேற்பட்ட மாதிரிகளில் சரிபார்க்கப்பட்டது',
    'stats.s2.label': 'இலக்கு வைக்கப்பட்ட பூச்சிகள்',
    'stats.s2.sub': 'இந்திய பயிர்களின் முக்கிய நோய்கள்',
    'stats.s3.label': 'பாதுகாக்கப்பட்ட ஏக்கர்',
    'stats.s3.sub': '14 வேளாண்-காலநிலை மண்டலங்களில்',
    'stats.s4.label': 'பூச்சிக்கொல்லி செலவு குறைப்பு',
    'stats.s4.sub': 'துல்லியமான இயற்கை மற்றும் வேதியியல் அளவுகள் மூலம்',

    // Features Section
    'feat.tag': '20+ துல்லிய வேளாண் கருவிகள் & தளங்கள்',
    'feat.title': 'பூச்சி கட்டுப்பாடு & துல்லிய வேளாண்மை',
    'feat.desc':
      'தெளிப்பு நேரம், உரங்களின் கலவை பாதுகாப்பு, சேமிப்பு கிடங்கு லாபம் மற்றும் செயற்கைக்கோள் பகுப்பாய்வு.',
    'feat.cat.All': 'அனைத்தும்',
    'feat.cat.Diagnostics': 'நோய் கண்டறிதல்',
    'feat.cat.Application Tech': 'தெளிப்பு தொழில்நுட்பம்',
    'feat.cat.Chemical Safety': 'இரசாயன பாதுகாப்பு',
    'feat.cat.Market Strategy': 'சந்தை உத்தி',
    'feat.cat.Soil Science': 'மண் அறிவியல்',
    'feat.cat.Water Management': 'நீர் மேலாண்மை',
    'feat.cat.Remote Sensing': 'செயற்கைக்கோள் கண்காணிப்பு',
    'feat.free': 'இலவச அணுகல்',
    'feat.protected': 'பாதுகாக்கப்பட்டது',
    'feat.simulate': 'கருவியை இயக்க →',

    // Platform Showcase (9.png)
    'showcase.mainTitle': 'முழுமையான பண்ணை நுண்ணறிவு (End-to-End Farm Intelligence)',
    'showcase.mainDesc':
      'வானிலை எச்சரிக்கைகள், செயற்கைக்கோள் பகுப்பாய்வு, மண் வளம் மற்றும் சந்தை வர்த்தகத்தை எளிதாகக் கையாளுங்கள்.',
    'showcase.tabWeather': 'உள்ளூர் வானிலை',
    'showcase.tabSatellite': 'செயற்கைக்கோள் NDVI ஸ்கேன்',
    'showcase.tabSoil': 'மண் வளம் மற்றும் ஈரப்பதம்',
    'showcase.tabMarket': 'சந்தை விலை நிலவரம்',

    'showcase.weather.tag': 'துல்லிய வேளாண்மை',
    'showcase.weather.title': 'AI வானிலை முன்னறிவிப்பு',
    'showcase.weather.desc':
      '72 மணி நேரத்திற்கு முன்னரே மருந்து தெளிப்பதற்கான உகந்த நேரம் மற்றும் வானிலை எச்சரிக்கைகளைப் பெறுங்கள்.',
    'showcase.weather.chk1': 'மணிநேர ஈரப்பதம், காற்றின் வேகம் பதிவு',
    'showcase.weather.chk2': 'மருந்து விரயமாவதை தடுக்கும் தெளிப்பு ஆலோசனை',
    'showcase.weather.chk3': 'கடுமையான வெப்பம் அல்லது புயல் எச்சரிக்கை',
    'showcase.weather.btn': 'டாஷ்போர்டில் பார்க்க →',

    'showcase.satellite.tag': 'செயற்கைக்கோள் கண்காணிப்பு',
    'showcase.satellite.title': 'சென்டினல்-2 பயிர் வளர்ச்சி ஆய்வு',
    'showcase.satellite.desc':
      'ஒவ்வொரு 5 நாட்களுக்கும் பயிர்களின் பசுமைத் திறனை ஆய்வு செய்து ஊட்டச்சத்துக் குறைபாடுகளை முன்கூட்டியே கண்டறியலாம்.',
    'showcase.satellite.chk1': '84 பிரிவுகளில் பச்சையம் அளவு ஆய்வு',
    'showcase.satellite.chk2': 'மேக மூட்டமற்ற தெளிவான செயற்கைக்கோள் படம்',
    'showcase.satellite.chk3': '100% ஆன்லைன் மேப்பிங் வசதி',
    'showcase.satellite.btn': 'ஸ்கேன் செய்ய →',

    'showcase.soil.tag': 'மண் ஈரப்பதம் & உரங்கள்',
    'showcase.soil.title': 'மண் ஈரப்பதம் மற்றும் N-P-K அளவு',
    'showcase.soil.desc':
      'வேர் பகுதியில் 15 செ.மீ மற்றும் 30 செ.மீ ஆழத்தில் ஈரப்பதத்தை அளந்து சொட்டு நீர் பாசன நேரத்தை கணக்கிடுகிறது.',
    'showcase.soil.chk1': 'வேருக்குத் தேவையான நீர் அளவு கணக்கீடு',
    'showcase.soil.chk2': 'உவர் தன்மையைத் தடுத்து மண் வளம் காத்தல்',
    'showcase.soil.chk3': 'நீர் விரயமின்றி சரியான பாசனம்',
    'showcase.soil.btn': 'டாஷ்போர்டில் பார்க்க →',

    'showcase.market.tag': 'சந்தை பொருளாதார லாபம்',
    'showcase.market.title': 'சந்தை விலைகள் & சேமிப்பு கிடங்கு ஆலோசனை',
    'showcase.market.desc':
      'உங்கள் பகுதியில் காணப்பட்ட சந்தை விலை, போக்குவரத்து மற்றும் சேமிப்பு செலவுகளை ஆய்வு செய்யுங்கள்.',
    'showcase.market.chk1': 'போக்குவரத்து செலவு கழித்த நிகர லாபம்',
    'showcase.market.chk2': 'கிடங்கு சேமிப்பு மூலமான கூடுதல் வருவாய்',
    'showcase.market.chk3': 'கிடங்கு ரசீதில் 7% வட்டியில் பயிர்க்கடன்',
    'showcase.market.btn': 'சந்தை விலைகளை ஒப்பிட →',

    // CTA 1 & 2
    'cta1.badge': 'இலவச 30-நாள் சோதனை முறை',
    'cta1.title': 'பயிர்களை பாதுகாத்து, சந்தையில் அதிக லாபம் பெறுங்கள்',
    'cta1.desc': 'உங்கள் பண்ணை பதிவுகள் மற்றும் காணப்பட்ட சந்தை விலைகளைப் புரிந்துகொள்ள AgriSence பயன்படுத்துங்கள்.',
    'cta1.btnStart': 'இப்போதே தொடங்குங்கள் →',
    'cta1.btnDash': 'டாஷ்போர்டை பார்க்க',
    'cta1.chk1': 'கூடுதல் உபகரணங்கள் தேவையில்லை',
    'cta1.chk2': 'வயல்களில் உடனடி AI கண்டறிதல்',
    'cta1.chk3': 'பிராந்திய மொழிகள் (தமிழ், இந்தி, மராத்தி, தெலுங்கு)',

    'cta2.badge': 'திறன்மிகு விவசாயத்திற்கு தயாரா',
    'cta2.title': 'மண் மற்றும் பயிர் பாதுகாப்போடு உற்பத்தியை பெருக்குங்கள்',
    'cta2.desc': 'ஆயிரக்கணக்கான விவசாயிகளோடு இணைந்து உங்கள் விளைச்சலை இரட்டிப்பாக்குங்கள்.',
    'cta2.btnStart': 'இலவசமாக தொடங்க →',
    'cta2.btnDash': 'டாஷ்போர்டிற்கு செல்ல',

    'footer.tagline': 'இந்திய விவசாயிகளுக்கான AI வேளாண் தளம்',
    'footer.rights': 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை. உழவர்களுக்கு அர்ப்பணிக்கப்பட்டது.',
  },

  gu: {
    // Navbar
    'nav.capabilities': 'પ્લેટફોર્મ વિશેષતાઓ',
    'nav.outbreak': 'જીવાત પ્રકોપ રડાર',
    'nav.pestScan': 'એઆઈ જીવાત તપાસ',
    'nav.arbitrage': 'બજાર ભાવ અને નફો',
    'nav.schemes': 'સરકારી યોજનાઓ',
    'nav.dashboard': 'ડેશબોર્ડ',
    'nav.voiceAi': 'વોઈસ એઆઈ (Voice)',
    'nav.signIn': 'સાઇન ઇન',
    'nav.getStarted': 'શરૂ કરો',
    'nav.tickerTitle': 'એપીએમસી લાઈવ બજાર ભાવ',

    // Hero
    'hero.badge': 'ભારતીય ખેડૂતો માટે અદ્યતન એઆઈ ટેકનોલોજી',
    'hero.title1': 'સ્માર્ટ ખેતી.',
    'hero.title2': 'ઉજ્જવળ ભવિષ્ય.',
    'hero.desc':
      'ખેતીના દરેક નિર્ણય માટે સંપૂર્ણ પ્લેટફોર્મ — હવામાન, એઆઈ જીવાત નિદાન, 72 કલાક અગાઉ ચેતવણી, સેટેલાઇટ મોનિટરિંગ, બજાર ભાવ અને સરકારી સહાય.',
    'hero.btnDashboard': 'ડેશબોર્ડ ખોલો →',
    'hero.btnPestScan': 'એઆઈ પેસ્ટ સ્કેન',
    'hero.metric1': '98.4% સચોટ એઆઈ',
    'hero.metric2': '72 કલાક પૂર્વ ચેતવણી',
    'hero.metric3': '24/7 કૃષિ સલાહકાર',

    // Floating Cards
    'float.card1.loc': 'રાજકોટ, ગુજરાત',
    'float.card1.hum': '💧 62% ભેજ',
    'float.card1.wind': '🍃 12 કિમી/કલાક',
    'float.card2.ai': 'એગ્રીસેન્સ એઆઈ',
    'float.card2.tag': 'કૃષિ સલાહ',
    'float.card2.text': 'સમયસર વાવણી કરીને 18% વધુ ઉપજ મેળવો.',
    'float.card4.mandi': 'કપાસ • રાજકોટ માર્કેટ',

    // Stats
    'stats.s1.label': 'જીવાત ઓળખ સચોટતા',
    'stats.s1.sub': '1 લાખ+ વાસ્તવિક નમૂનાઓ પર પરીક્ષિત',
    'stats.s2.label': 'લક્ષિત જીવાતોની જાતો',
    'stats.s2.sub': 'ભારતીય પાકોના મુખ્ય રોગ અને જીવાતો',
    'stats.s3.label': 'સંરક્ષિત એકર જમીન',
    'stats.s3.sub': '14 કૃષિ આબોહવા ઝોનમાં સક્રિય',
    'stats.s4.label': 'દવાઓના ખર્ચમાં ઘટાડો',
    'stats.s4.sub': 'સચોટ જૈવિક અને વૈજ્ઞાનિક માત્રા દ્વારા',

    // Features Section
    'feat.tag': '20+ અદ્યતન કૃષિ સિમ્યુલેટર & સાધનો',
    'feat.title': 'સચોટ ખેતી અને જીવાત નિયંત્રણ',
    'feat.desc':
      'દવા છંટકાવનો યોગ્ય સમય, રાસાયણિક સુસંગતતા, માર્કેટ યાર્ડ સ્ટોરેજ નફો અને સેટેલાઇટ વિશ્લેષણ.',
    'feat.cat.All': 'બધા',
    'feat.cat.Diagnostics': 'રોગ નિદાન',
    'feat.cat.Application Tech': 'છંટકાવ તકનીક',
    'feat.cat.Chemical Safety': 'રાસાયણિક સુરક્ષા',
    'feat.cat.Market Strategy': 'બજાર વ્યૂહરચના',
    'feat.cat.Soil Science': 'જમીન વિજ્ઞાન',
    'feat.cat.Water Management': 'જળ વ્યવસ્થાપન',
    'feat.cat.Remote Sensing': 'સેટેલાઇટ મોનિટરિંગ',
    'feat.free': 'મફત પ્રવેશ',
    'feat.protected': 'સુરક્ષિત',
    'feat.simulate': 'મોડેલ ચલાવો →',

    // Platform Showcase (9.png)
    'showcase.mainTitle': 'સંપૂર્ણ ખેતી બુદ્ધિમત્તા (End-to-End Farm Intelligence)',
    'showcase.mainDesc':
      'હવામાન ચેતવણી, સેટેલાઇટ એનાલિટિક્સ, જમીન પરીક્ષણ અને મંડી વેપારનું સરળ સંકલન.',
    'showcase.tabWeather': 'સ્થાનિક હવામાન',
    'showcase.tabSatellite': 'સેટેલાઇટ NDVI સ્કેન',
    'showcase.tabSoil': 'જમીન માહિતી અને ભેજ',
    'showcase.tabMarket': 'બજાર ભાવ અને નફો',

    'showcase.weather.tag': 'ચોક્કસ કૃષિ વિજ્ઞાન',
    'showcase.weather.title': 'એઆઈ-સંચાલિત હવામાન આગાહી',
    'showcase.weather.desc':
      '72 કલાક અગાઉ દવા છંટકાવ માટે યોગ્ય સમય અને માવઠા કે હિમની ચેતવણી મેળવો.',
    'showcase.weather.chk1': 'કલાકવાર ભેજ, પવનની ગતિની નોંધ',
    'showcase.weather.chk2': 'દવાનો બગાડ અટકાવવા યોગ્ય છંટકાવ સલાહ',
    'showcase.weather.chk3': 'તીવ્ર ગરમી કે ઠંડીની સીધી મોબાઈલ પર ચેતવણી',
    'showcase.weather.btn': 'ડેશબોર્ડમાં જુઓ →',

    'showcase.satellite.tag': 'ઓર્બિટલ સેટેલાઇટ મોનિટરિંગ',
    'showcase.satellite.title': 'સેન્ટિનેલ-2 પાક પરાવર્તન વિશ્લેષણ',
    'showcase.satellite.desc':
      'દર 5 દિવસે સેટેલાઇટ દ્વારા પાકની વૃદ્ધિ અને પોષક તત્વોની ચકાસણી.',
    'showcase.satellite.chk1': '84 ઝોનમાં ક્લોરોફિલ સ્તરની તપાસ',
    'showcase.satellite.chk2': 'વાદળો મુક્ત ચોખ્ખી સેટેલાઇટ ઈમેજ',
    'showcase.satellite.chk3': 'સાધનો વિના 100% ડિજિટલ મેપિંગ',
    'showcase.satellite.btn': 'સ્કેન શરૂ કરો →',

    'showcase.soil.tag': 'જમીન ભેજ અને પોષક તત્વો',
    'showcase.soil.title': 'જમીનનો ભેજ અને N-P-K પોષણ સ્તર',
    'showcase.soil.desc':
      'મૂળિયામાં 15 સેમી અને 30 સેમી ઊંડાઈએ ભેજ માપીને ટપક પદ્ધતિનો સમય નક્કી થાય છે.',
    'showcase.soil.chk1': 'મૂળિયાને જરૂરી પાણીની સચોટ ગણતરી',
    'showcase.soil.chk2': 'ક્ષાર નિયંત્રણ કરી જમીનની ફળદ્રુપતા રક્ષણ',
    'showcase.soil.chk3': 'પાણીનો બગાડ અટકાવી ચોક્કસ સિંચાઈ',
    'showcase.soil.btn': 'ડેશબોર્ડમાં જુઓ →',

    'showcase.market.tag': 'મંડી આર્થિક નફો મોડલ',
    'showcase.market.title': 'માર્કેટ યાર્ડ લાઈવ ભાવ & સ્ટોરેજ નફો',
    'showcase.market.desc':
      'તમારા વિસ્તારમાં નોંધાયેલા બજાર ભાવ, પરિવહન અને સંગ્રહ ખર્ચની સમીક્ષા કરો.',
    'showcase.market.chk1': 'પરિવહન ખર્ચ બાદ કરી ચોખ્ખો નફો',
    'showcase.market.chk2': 'વેરહાઉસ સંગ્રહ દ્વારા વધુ કમાણી',
    'showcase.market.chk3': 'વેરહાઉસ રસીદ પર 7% વ્યાજે લોન સુવિધા',
    'showcase.market.btn': 'બજાર ભાવ સરખાવો →',

    // CTA 1 & 2
    'cta1.badge': 'મફત 30-દિવસીય એગ્રીટેક ટ્રાયલ',
    'cta1.title': 'પાકનું રક્ષણ કરો, બજારમાંથી મહત્તમ નફો મેળવો',
    'cta1.desc': 'તમારા ખેતરના રેકોર્ડ અને નોંધાયેલા બજાર ભાવ સમજવા માટે AgriSence વાપરો.',
    'cta1.btnStart': 'હમણાં શરૂ કરો →',
    'cta1.btnDash': 'લાઈવ ડેશબોર્ડ જુઓ',
    'cta1.chk1': 'કોઈ વધારાના સાધનોની જરૂર નથી',
    'cta1.chk2': 'ખેતરોમાં તાત્કાલિક AI નિદાન',
    'cta1.chk3': 'પ્રાદેશિક ભાષાઓ (ગુજરાતી, હિન્દી, મરાઠી, તેલુગુ)',

    'cta2.badge': 'સ્માર્ટ ખેતી માટે સજ્જ થાઓ',
    'cta2.title': 'જમીન અને પાક સંરક્ષણ સાથે ઉત્પાદન બમણું કરો',
    'cta2.desc': 'હજારો પ્રગતિશીલ ખેડૂતો સાથે જોડાઈને તમારી ખેતીને સમૃદ્ધ બનાવો.',
    'cta2.btnStart': 'મફતમાં શરૂ કરો →',
    'cta2.btnDash': 'ડેશબોર્ડ પર જાઓ',

    'footer.tagline': 'ભારતીય ખેડૂત મિત્રો માટે એઆઈ આધારિત સ્માર્ટ પ્લેટફોર્મ',
    'footer.rights': 'સર્વ હક સુરક્ષિત. જગતના તાતને સમર્પિત.',
  },

  pa: {
    // Navbar
    'nav.capabilities': 'ਪਲੇਟਫਾਰਮ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ',
    'nav.outbreak': 'ਕੀੜੇ ਹਮਲੇ ਦਾ ਰਾਡਾਰ',
    'nav.pestScan': 'ਏਆਈ ਕੀਟ ਜਾਂਚ',
    'nav.arbitrage': 'ਮੰਡੀ ਭਾਅ ਅਤੇ ਲਾਭ',
    'nav.schemes': 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ',
    'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ',
    'nav.voiceAi': 'ਵਾਇਸ ਏਆਈ (Voice)',
    'nav.signIn': 'ਸਾਈਨ ਇਨ',
    'nav.getStarted': 'ਸ਼ੁਰੂ ਕਰੋ',
    'nav.tickerTitle': 'ਏਪੀਐਮਸੀ ਲਾਈਵ ਮੰਡੀ ਟਿੱਕਰ',

    // Hero
    'hero.badge': 'ਭਾਰਤੀ ਕਿਸਾਨਾਂ ਲਈ ਸਮਰਪਿਤ ਅਤਿ-ਆਧੁਨਿਕ ਏਆਈ',
    'hero.title1': 'ਸਮਾਰਟ ਖੇਤੀ।',
    'hero.title2': 'ਬਿਹਤਰ ਭਵਿੱਖ।',
    'hero.desc':
      'ਖੇਤੀਬਾੜੀ ਦੇ ਹਰ ਫੈਸਲੇ ਲਈ ਸੰਪੂਰਨ ਹੱਲ — ਮੌਸਮ, ਏਆਈ ਕੀਟ ਪਛਾਣ, 72 ਘੰਟੇ ਪਹਿਲਾਂ ਚੇਤਾਵਨੀ, ਸੈਟੇਲਾਈਟ ਨਿਗਰਾਨੀ, ਮੰਡੀ ਭਾਅ ਅਤੇ ਸਬਸਿਡੀਆਂ।',
    'hero.btnDashboard': 'ਡੈਸ਼ਬੋਰਡ ਖੋਲ੍ਹੋ →',
    'hero.btnPestScan': 'ਏਆਈ ਕੀਟ ਸਕੈਨ',
    'hero.metric1': '98.4% ਸਹੀ ਏਆਈ',
    'hero.metric2': '72 ਘੰਟੇ ਪਹਿਲਾਂ ਚੇਤਾਵਨੀ',
    'hero.metric3': '24/7 ਖੇਤੀ ਸਲਾਹਕਾਰ',

    // Floating Cards
    'float.card1.loc': 'ਲੁਧਿਆਣਾ, ਪੰਜਾਬ',
    'float.card1.hum': '💧 62% ਨਮੀ',
    'float.card1.wind': '🍃 12 ਕਿਮੀ/ਘੰਟਾ',
    'float.card2.ai': 'ਐਗਰੀਸੈਂਸ ਏਆਈ',
    'float.card2.tag': 'ਖੇਤੀ ਸਲਾਹ',
    'float.card2.text': 'ਸਮੇਂ ਸਿਰ ਬਿਜਾਈ ਕਰਕੇ 18% ਵੱਧ ਝਾੜ ਪ੍ਰਾਪਤ ਕਰੋ।',
    'float.card4.mandi': 'ਕਣਕ • ਲੁਧਿਆਣਾ ਮੰਡੀ',

    // Stats
    'stats.s1.label': 'ਕੀਟ ਪਛਾਣ ਸ਼ੁੱਧਤਾ',
    'stats.s1.sub': '1 ਲੱਖ+ ਖੇਤਰੀ ਨਮੂਨਿਆਂ ਤੇ ਪਰਖਿਆ ਗਿਆ',
    'stats.s2.label': 'ਨਿਸ਼ਾਨਾ ਬਣਾਏ ਗਏ ਕੀੜੇ',
    'stats.s2.sub': 'ਭਾਰਤੀ ਫਸਲਾਂ ਦੇ ਪ੍ਰਮੁੱਖ ਰੋਗ',
    'stats.s3.label': 'ਸੁਰੱਖਿਅਤ ਏਕੜ ਰਕਬਾ',
    'stats.s3.sub': '14 ਖੇਤੀ-ਜਲਵਾਯੂ ਜ਼ੋਨਾਂ ਵਿੱਚ ਸਰਗਰਮ',
    'stats.s4.label': 'ਕੀਟਨਾਸ਼ਕਾਂ ਦੇ ਖਰਚੇ ਵਿੱਚ ਕਮੀ',
    'stats.s4.sub': 'ਸਹੀ ਜੈਵਿਕ ਅਤੇ ਵਿਗਿਆਨਕ ਮਾਤਰਾ ਰਾਹੀਂ',

    // Features Section
    'feat.tag': '20+ ਆਧੁਨਿਕ ਖੇਤੀਬਾੜੀ ਸਿਮੂਲੇਟਰ & ਸਾਧਨ',
    'feat.title': 'ਸਮਾਰਟ ਕੀਟ ਨਿਯੰਤਰਣ ਅਤੇ ਖੇਤੀਬਾੜੀ',
    'feat.desc':
      'ਸਪਰੇਅ ਦਾ ਸਹੀ ਸਮਾਂ, ਰਸਾਇਣਕ ਅਨੁਕੂਲਤਾ, ਮੰਡੀ ਸਟੋਰੇਜ ਲਾਭ ਅਤੇ ਸੈਟੇਲਾਈਟ ਵਿਸ਼ਲੇਸ਼ਣ।',
    'feat.cat.All': 'ਸਾਰੇ',
    'feat.cat.Diagnostics': 'ਰੋਗ ਪਛਾਣ',
    'feat.cat.Application Tech': 'ਸਪਰੇਅ ਤਕਨਾਲੋਜੀ',
    'feat.cat.Chemical Safety': 'ਰਸਾਇਣਕ ਸੁਰੱਖਿਆ',
    'feat.cat.Market Strategy': 'ਮੰਡੀ ਰਣਨੀਤੀ',
    'feat.cat.Soil Science': 'ਮਿੱਟੀ ਵਿਗਿਆਨ',
    'feat.cat.Water Management': 'ਪਾਣੀ ਪ੍ਰਬੰਧਨ',
    'feat.cat.Remote Sensing': 'ਸੈਟੇਲਾਈਟ ਨਿਗਰਾਨੀ',
    'feat.free': 'ਮੁਫ਼ਤ ਪਹੁੰਚ',
    'feat.protected': 'ਸੁਰੱਖਿਅਤ',
    'feat.simulate': 'ਮਾਡਲ ਚਲਾਓ →',

    // Platform Showcase (9.png)
    'showcase.mainTitle': 'ਸੰਪੂਰਨ ਖੇਤੀ ਗਿਆਨ (End-to-End Farm Intelligence)',
    'showcase.mainDesc':
      'ਮੌਸਮ ਚੇਤਾਵਨੀ, ਸੈਟੇਲਾਈਟ ਵਿਸ਼ਲੇਸ਼ਣ, ਮਿੱਟੀ ਸਿਹਤ ਅਤੇ ਮੰਡੀ ਵਪਾਰ ਦਾ ਸਾਂਝਾ ਅਨੁਭਵ।',
    'showcase.tabWeather': 'ਸਥਾਨਕ ਮੌਸਮ',
    'showcase.tabSatellite': 'ਸੈਟੇਲਾਈਟ NDVI ਸਕੈਨ',
    'showcase.tabSoil': 'ਮਿੱਟੀ ਸਿਹਤ ਅਤੇ ਨਮੀ',
    'showcase.tabMarket': 'ਮੰਡੀ ਭਾਅ ਅਤੇ ਲਾਭ',

    'showcase.weather.tag': 'ਪ੍ਰੈਸੀਜ਼ਨ ਖੇਤੀਬਾੜੀ',
    'showcase.weather.title': 'ਏਆਈ ਅਧਾਰਤ ਸਥਾਨਕ ਮੌਸਮ ਭਵਿੱਖਬਾਣੀ',
    'showcase.weather.desc':
      '72 ਘੰਟੇ ਪਹਿਲਾਂ ਸਪਰੇਅ ਲਈ ਸਹੀ ਸਮਾਂ ਅਤੇ ਮੀਂਹ ਜਾਂ ਝੱਖੜ ਦੀ ਚੇਤਾਵਨੀ ਪ੍ਰਾਪਤ ਕਰੋ।',
    'showcase.weather.chk1': 'ਘੰਟੇਵਾਰ ਨਮੀ, ਹਵਾ ਦੀ ਗਤੀ ਦਾ ਹਿਸਾਬ',
    'showcase.weather.chk2': 'ਦਵਾਈ ਦੀ ਬਰਬਾਦੀ ਰੋਕਣ ਲਈ ਸਪਰੇਅ ਸਲਾਹ',
    'showcase.weather.chk3': 'ਅਚਾਨਕ ਠੰਡ ਜਾਂ ਲੂ ਦੀ ਸਿੱਧੀ ਫੋਨ ਤੇ ਸੂਚਨਾ',
    'showcase.weather.btn': 'ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਦੇਖੋ →',

    'showcase.satellite.tag': 'ਸੈਟੇਲਾਈਟ ਨਿਗਰਾਨੀ',
    'showcase.satellite.title': 'ਸੈਂਟੀਨਲ-2 ਫ਼ਸਲੀ ਵਿਕਾਸ ਰਿਪੋਰਟ',
    'showcase.satellite.desc':
      'ਹਰ 5 ਦਿਨਾਂ ਬਾਅਦ ਸੈਟੇਲਾਈਟ ਰਾਹੀਂ ਫ਼ਸਲ ਦੀ ਸਿਹਤ ਅਤੇ ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਕਮੀ ਦੀ ਜਾਂਚ।',
    'showcase.satellite.chk1': '84 ਹਿੱਸਿਆਂ ਵਿੱਚ ਕਲੋਰੋਫਿਲ ਦੀ ਜਾਂਚ',
    'showcase.satellite.chk2': 'ਬੱਦਲਾਂ ਤੋਂ ਬਿਨਾਂ ਸਾਫ਼ ਸੈਟੇਲਾਈਟ ਤਸਵੀਰਾਂ',
    'showcase.satellite.chk3': 'ਬਿਨਾਂ ਸਾਧਨਾਂ ਤੋਂ 100% ਆਨਲਾਈਨ ਮੈਪਿੰਗ',
    'showcase.satellite.btn': 'ਸਕੈਨ ਸ਼ੁਰੂ ਕਰੋ →',

    'showcase.soil.tag': 'ਮਿੱਟੀ ਨਮੀ ਅਤੇ ਖਾਦਾਂ',
    'showcase.soil.title': 'ਮਿੱਟੀ ਦੀ ਨਮੀ ਅਤੇ N-P-K ਪੋਸ਼ਣ',
    'showcase.soil.desc':
      'ਜੜ੍ਹਾਂ ਵਿੱਚ 15 ਅਤੇ 30 ਸੈਂਟੀਮੀਟਰ ਡੂੰਘਾਈ ਤੇ ਨਮੀ ਮਾਪ ਕੇ ਤੁਪਕਾ ਸਿੰਚਾਈ ਦਾ ਸਮਾਂ ਤੈਅ ਹੁੰਦਾ ਹੈ।',
    'showcase.soil.chk1': 'ਜੜ੍ਹਾਂ ਲਈ ਲੋੜੀਂਦੇ ਪਾਣੀ ਦਾ ਸਹੀ ਹਿਸਾਬ',
    'showcase.soil.chk2': 'ਖਾਰੇਪਣ ਤੋਂ ਬਚਾਅ ਅਤੇ ਮਿੱਟੀ ਦੀ ਉਪਜਾਊ ਸ਼ਕਤੀ',
    'showcase.soil.chk3': 'ਪਾਣੀ ਦੀ ਬੱਚਤ ਨਾਲ ਸਹੀ ਤੁਪਕਾ ਸਿੰਚਾਈ',
    'showcase.soil.btn': 'ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਦੇਖੋ →',

    'showcase.market.tag': 'ਮੰਡੀ ਆਰਥਿਕ ਲਾਭ ਮਾਡਲ',
    'showcase.market.title': 'ਮੰਡੀ ਲਾਈਵ ਭਾਅ & ਸਟੋਰੇਜ ਲਾਭ',
    'showcase.market.desc':
      'ਆਪਣੇ ਖੇਤਰ ਦੇ ਦਰਜ ਕੀਤੇ ਮੰਡੀ ਭਾਅ, ਆਵਾਜਾਈ ਅਤੇ ਸਟੋਰੇਜ ਖਰਚਿਆਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ।',
    'showcase.market.chk1': 'ਢੋਆ-ਢੁਆਈ ਖਰਚਾ ਘਟਾ ਕੇ ਅਸਲ ਮੁਨਾਫ਼ਾ',
    'showcase.market.chk2': 'ਵੇਅਰਹਾਊਸ ਸਟੋਰੇਜ ਰਾਹੀਂ ਵੱਧ ਕਮਾਈ',
    'showcase.market.chk3': 'ਗੋਦਾਮ ਰਸੀਦ ਤੇ 7% ਵਿਆਜ ਤੇ ਕਰਜ਼ਾ ਸਹੂਲਤ',
    'showcase.market.btn': 'ਮੰਡੀ ਭਾਅ ਮਿਲਾਓ →',

    // CTA 1 & 2
    'cta1.badge': 'ਮੁਫ਼ਤ 30-ਦਿਨਾ ਖੇਤੀਬਾੜੀ ਟ੍ਰਾਇਲ',
    'cta1.title': 'ਆਪਣੀ ਫ਼ਸਲ ਬਚਾਓ, ਮੰਡੀ ਤੋਂ ਵੱਧ ਤੋਂ ਵੱਧ ਮੁਨਾਫ਼ਾ ਲਵੋ',
    'cta1.desc': 'ਆਪਣੇ ਖੇਤ ਦੇ ਰਿਕਾਰਡ ਅਤੇ ਦਰਜ ਕੀਤੇ ਮੰਡੀ ਭਾਅ ਸਮਝਣ ਲਈ AgriSence ਵਰਤੋ।',
    'cta1.btnStart': 'ਹੁਣੇ ਸ਼ੁਰੂ ਕਰੋ →',
    'cta1.btnDash': 'ਲਾਈਵ ਡੈਸ਼ਬੋਰਡ ਦੇਖੋ',
    'cta1.chk1': 'ਕਿਸੇ ਹਾਰਡਵੇਅਰ ਦੀ ਲੋੜ ਨਹੀਂ',
    'cta1.chk2': 'ਖੇਤਾਂ ਵਿੱਚ ਤੁਰੰਤ AI ਨਿਦਾਨ',
    'cta1.chk3': 'ਖੇਤਰੀ ਭਾਸ਼ਾਵਾਂ (ਪੰਜਾਬੀ, ਹਿੰਦੀ, ਮਰਾਠੀ, ਤੇਲਗੂ)',

    'cta2.badge': 'ਸਮਾਰਟ ਫ਼ਸਲ ਸੁਰੱਖਿਆ ਲਈ ਤਿਆਰ ਹੋਵੋ',
    'cta2.title': 'ਸਹੀ ਕੀਟ ਅਤੇ ਮਿੱਟੀ ਸੁਰੱਖਿਆ ਨਾਲ ਪੈਦਾਵਾਰ ਵਧਾਓ',
    'cta2.desc': 'ਹਜ਼ਾਰਾਂ ਅਗਾਂਹਵਧੂ ਕਿਸਾਨਾਂ ਨਾਲ ਜੁੜ ਕੇ ਆਪਣੀ ਖੇਤੀ ਨੂੰ ਖੁਸ਼ਹਾਲ ਬਣਾਓ।',
    'cta2.btnStart': 'ਮੁਫ਼ਤ ਸ਼ੁਰੂ ਕਰੋ →',
    'cta2.btnDash': 'ਡੈਸ਼ਬੋਰਡ ਤੇ ਜਾਓ',

    'footer.tagline': 'ਭਾਰਤੀ ਅੰਨਦਾਤਿਆਂ ਲਈ ਏਆਈ-ਸਮਰੱਥ ਆਧੁਨਿਕ ਖੇਤੀ ਪਲੇਟਫਾਰਮ',
    'footer.rights': 'ਸਾਰੇ ਹੱਕ ਰਾਖਵੇਂ ਹਨ। ਦੇਸ਼ ਦੇ ਕਿਸਾਨਾਂ ਨੂੰ ਸਮਰਪਿਤ।',
  },
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  currentLangConfig: LanguageOption;
  t: (key: string, fallback?: string) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agrisence_lang');
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.id === saved)) {
        return saved;
      }
    }
    return 'en';
  });

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrisence_lang', lang);
      window.dispatchEvent(new CustomEvent('agrisence_lang_changed', { detail: lang }));
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'agrisence_lang' && e.newValue) {
        setLanguageState(e.newValue);
      }
    };
    const handleCustomChange = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        setLanguageState(custom.detail);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('agrisence_lang_changed', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('agrisence_lang_changed', handleCustomChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
  }, [language]);

  const currentLangConfig =
    SUPPORTED_LANGUAGES.find((l) => l.id === language) || SUPPORTED_LANGUAGES[0];

  const t = useCallback((key: string, fallback?: string): string => {
    // Resolve every dictionary in the selected language before falling back
    // to English. The previous order returned English too early and caused
    // translated page-level entries to be ignored.
    const selectedDictionaries = [
      COMMAND_CENTER_TRANSLATIONS[language],
      APP_PAGE_TRANSLATIONS[language],
      EXTENDED_TRANSLATIONS[language],
      TRANSLATIONS[language],
    ];

    for (const dictionary of selectedDictionaries) {
      if (dictionary?.[key]) return dictionary[key];
    }

    const englishDictionaries = [
      COMMAND_CENTER_TRANSLATIONS.en,
      APP_PAGE_TRANSLATIONS.en,
      EXTENDED_TRANSLATIONS.en,
      TRANSLATIONS.en,
    ];

    for (const dictionary of englishDictionaries) {
      if (dictionary?.[key]) return dictionary[key];
    }

    return fallback || key;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLangConfig,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
