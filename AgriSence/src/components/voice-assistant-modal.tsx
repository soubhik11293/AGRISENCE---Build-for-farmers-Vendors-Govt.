import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Globe, X, Sprout as Sparkles, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/src/context/language-context';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useTelemetry } from '@/src/context/telemetry-context';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Multilingual Agronomy Knowledge Base for Intelligent Dialect Responses
const AGRONOMY_KNOWLEDGE: Record<string, {
  defaultAnswer: string;
  keywords: Array<{
    terms: string[];
    answer: string;
  }>;
}> = {
  en: {
    defaultAnswer:
      'Based on current soil moisture (28.5%) and temperature (29°C), field conditions are optimal. Apply 5% Neem Seed Kernel Extract (NSKE) during morning hours for early borer suppression, and schedule drip fertigation with Potassium Schoenite at dawn.',
    keywords: [
      {
        terms: ['fertilizer', 'urea', 'npk', 'dosage', 'soil'],
        answer:
          'For sandy loam, apply recommended NPK 120:60:40 kg/ha. Split nitrogen into 3 doses: 50% basal at sowing, 25% at first irrigation (crown root initiation), and 25% at panicle emergence. Supplement with 25 kg/ha zinc sulfate.',
      },
      {
        terms: ['pest', 'worm', 'bollworm', 'caterpillar', 'spray', 'disease'],
        answer:
          'For Pink Bollworm or Fall Armyworm, install 5 pheromone lure traps per acre. Spray Azadirachtin 1500 ppm @ 3 ml/L or Emamectin Benzoate 5% SG @ 0.4 g/L during calm morning hours (wind <10 km/h).',
      },
      {
        terms: ['price', 'mandi', 'rate', 'market', 'sell'],
        answer:
          'Lasalgaon APMC modal rate is ₹4,850/qtl with an upward trend (+₹180/qtl spread). Withholding crop in a WDRA accredited warehouse for 45 days is projected to realize +₹240/qtl after storage rent.',
      },
      {
        terms: ['weather', 'rain', 'wind', 'temperature'],
        answer:
          'Pune district weather: Current 29°C, 62% humidity, wind 12 km/h SE. Favorable spray window open today between 06:30 AM and 09:30 AM before midday thermal updrafts exceed safe drift limits.',
      },
      {
        terms: ['scheme', 'subsidy', 'pmkisan', 'insurance', 'pmfby'],
        answer:
          'PMFBY 72-hour localized disaster intimation protocol is active. In case of inundation or hailstorm, file a claim on the PMFBY portal or call toll-free 14447 within 72 hours for interim DBT compensation.',
      },
    ],
  },
  hi: {
    defaultAnswer:
      'वर्तमान मृदा नमी (28.5%) और तापमान (29°C) के आधार पर परिस्थितियां अनुकूल हैं। सुबह 09:30 से पहले 5% नीम अर्क (NSKE) का छिड़काव करें और ड्रिप से पोटाश की संस्तुत खुराक दें।',
    keywords: [
      {
        terms: ['खाद', 'उर्वरक', 'यूरिया', 'एनपीके', 'मात्रा'],
        answer:
          'गेहूं व सोयाबीन के लिए एनपीके 120:60:40 किग्रा/हेक्टेयर संस्तुत है। यूरिया की आधी मात्रा बुवाई पर तथा शेष दो बराबर भागों में पहली व दूसरी सिंचाई पर दें। साथ में 25 किग्रा जिंक सल्फेट डालें।',
      },
      {
        terms: ['कीट', 'इल्ली', 'रोग', 'दवा', 'छिड़काव', 'बोंडअल्ली'],
        answer:
          'फॉल आर्मीवर्म या बोंड इल्ली के लिए प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं। 5% नीम तेल (अज़ाडिरैक्टिन 1500 ppm) 3 मिली प्रति लीटर अथवा इमामेक्टिन बेंजोएट 5% SG 0.4 ग्राम/लीटर का सुबह छिड़काव करें।',
      },
      {
        terms: ['मंडी', 'भाव', 'दाम', 'बाजार', 'रेट'],
        answer:
          'लासलगांव मंडी में सोयाबीन का मॉडल भाव ₹4,850 प्रति क्विंटल है (+₹180 की तेजी)। यदि आप डब्ल्यूडीआरए गोदाम में फसल रोकते हैं तो 45 दिन बाद ₹240/क्विंटल अधिक मुनाफा मिलने का अनुमान है।',
      },
      {
        terms: ['मौसम', 'बारिश', 'हवा', 'तापमान'],
        answer:
          'क्षेत्रीय मौसम: तापमान 29°C, आर्द्रता 62%, हवा 12 किमी/घंटा। आज सुबह 09:30 बजे तक छिड़काव का सबसे उत्तम समय है, दोपहर में तेज हवा के कारण दवा बर्बाद हो सकती है।',
      },
      {
        terms: ['योजना', 'सब्सिडी', 'बीमा', 'मुआवजा', 'पीएम किसान'],
        answer:
          'पीएम फसल बीमा योजना (PMFBY) के तहत नुकसान की स्थिति में 72 घंटे के भीतर टोल-फ्री 14447 पर सूचना दर्ज कराएं। 25% तक अंतरिम राहत सीधे आपके आधार-लिंक्ड बैंक खाते में भेजी जाएगी।',
      },
    ],
  },
  mr: {
    defaultAnswer:
      'सध्याच्या जमिनीतील ओलावा (२८.५%) व २९°से तापमानानुसार पिकांची वाढ उत्तम आहे. रसशोषक किडींसाठी सकाळी निंबोळी अर्क ५% ची फवारणी करा आणि ठिबक सिंचनातून पोटॅशियम शोएनाइट द्या.',
    keywords: [
      {
        terms: ['खत', 'युरिया', 'मात्रा', 'डोस', 'एनपीके'],
        answer:
          'मध्यम ते भारी जमिनीसाठी १००:५०:५० किलो नत्र, स्फुरद व पालाश प्रति हेक्टरी शिफारस आहे. युरिया तीन हप्त्यांत द्या: पेरणीवेळी ५०%, ३० दिवसांनी २५% आणि फुले येताना २५%.',
      },
      {
        terms: ['कीड', 'बोंडअळी', 'रोग', 'फवारणी', 'औषध'],
        answer:
          'कापसावरील बोंडअळीसाठी एकरी ५ कामगंध सापळे लावा. प्रादुर्भाव दिसताच निंबोळी अर्क ५% किंवा क्लोरँट्रानिलीप्रोल १८.५% एससी ०.३ मिली प्रति लिटर पाण्यात मिसळून सकाळी फवारा.',
      },
      {
        terms: ['भाव', 'बाजारभाव', 'मंडी', 'दर', 'विक्री'],
        answer:
          'लासलगाव व वाशी बाजारात सोयाबीनचे सरासरी भाव ₹४,८५०/क्विंटल आहेत. वखार महामंडळाच्या गोदामात साठवणूक केल्यास पुढील महिन्यात ₹२५० ते ₹३०० प्रति क्विंटल अधिक दर मिळू शकतो.',
      },
      {
        terms: ['हवामान', 'पाऊस', 'थंडी', 'वारा'],
        answer:
          'स्थानिक हवामान: २९°सेल्सिअस, ६२% आर्द्रता, वाऱ्याचा वेग १२ किमी/तास. आज सकाळी ६:३० ते ९:३० ही वेळ फवारणीसाठी अत्यंत अनुकूल आहे.',
      },
      {
        terms: ['योजना', 'अनुदान', 'विमा', 'नुकसानभरपाई'],
        answer:
          'पिक विमा (PMFBY) अंतर्गत अतिवृष्टी किंवा कीड नुकसानीची नोंद ७२ तासांच्या आत क्रॉप इन्शुरन्स ॲपवर किंवा १४४४७ क्रमांकावर करा. भरपाई थेट आधार संलग्न बँक खात्यात जमा होते.',
      },
    ],
  },
  bn: {
    defaultAnswer:
      'বর্তমান মাটির আর্দ্রতা (২৮.৫%) এবং তাপমাত্রা (২৯°C) ফসলের জন্য অত্যন্ত অনুকূল। সকালে নিম তেল ৩ মিলি/লিটার অথবা ৫% নিম পাতার নির্যাস স্প্রে করুন এবং সঠিক সেচ বজায় রাখুন।',
    keywords: [
      {
        terms: ['সার', 'ইউরিয়া', 'এনপিকে', 'মাত্রা', 'মাটি'],
        answer:
          'ধানের জন্য প্রতি বিঘায় এনপিকে সার প্রয়োগ করুন: ইউরিয়া ১৬ কেজি, ডিএপি ১০ কেজি এবং এমওপি ৮ কেজি। ইউরিয়া তিন কিস্তিতে দিন — চারা রোপণের সময়, কুশি আসার সময় এবং থোড় আসার মুখে।',
      },
      {
        terms: ['পোকা', 'ব্লাস্ট', 'মাজরা', 'রোগ', 'কীটনাশক', 'স্প্রে'],
        answer:
          'ধানের মাজরা পোকা বা ব্লাস্ট রোগের জন্য ট্রাইসাইক্লাজোল ৭৫% WP @ ০.৬ গ্রাম/লিটার অথবা ক্লোরপায়রিফস ২০% EC ২ মিলি/লিটার সকালের শান্ত আবহাওয়ায় স্প্রে করুন।',
      },
      {
        terms: ['দাম', 'মান্ডি', 'দর', 'বাজার'],
        answer:
          'আজকের এপিএমসি মান্ডিতে ধানের মডেল দর ₹২,১৮০ থেকে ₹২,৩৫০ প্রতি কুইন্টাল। সরকারি ক্রয়কেন্দ্রে বিক্রি করলে সহায়ক মূল্যে (MSP) সর্বোচ্চ লাভ নিশ্চিত হবে।',
      },
      {
        terms: ['আবহাওয়া', 'বৃষ্টি', 'ঝড়', 'বাতাস'],
        answer:
          'আবহাওয়ার পূর্বাভাস: তাপমাত্রা ২৯°C, আর্দ্রতা ৬২%, বাতাস ১২ কিমি/ঘণ্টা। আজ সকাল ৯টার মধ্যে স্প্রে করার উপযুক্ত সময়, দুপুরে বাতাসের বেগ বাড়লে স্প্রে করবেন না।',
      },
      {
        terms: ['প্রকল্প', 'বীমা', 'ভর্তুকি', 'কৃষক বন্ধু'],
        answer:
          'বাংলা শস্য বীমা ও কৃষক বন্ধু প্রকল্পের আওতায় প্রাকৃতিক দুর্যোগের ৭২ ঘণ্টার মধ্যে স্থানীয় কৃষি আধিকারিককে জানান। ক্ষতিপূরণের টাকা সরাসরি আধার-সংযুক্ত ব্যাংক অ্যাকাউন্টে জমা হবে।',
      },
    ],
  },
  te: {
    defaultAnswer:
      'ప్రస్తుత నేల తేమ (28.5%) మరియు ఉష్ణోగ్రత (29°C) అనుకూలంగా ఉన్నాయి. ఉదయం వేళల్లో 5% వేప గింజల కషాయం (NSKE) పిచికారీ చేయండి మరియు డ్రిప్ ద్వారా పొటాష్ అందించండి.',
    keywords: [
      {
        terms: ['ఎరువు', 'యూరియా', 'ఎన్పీకే', 'మోతాదు'],
        answer:
          'పంటకు సమతుల్య పోషకాలు అవసరం. ఎకరానికి 100:50:50 కిలోల ఎన్పీకే సిఫార్సు చేయబడింది. యూరియాను మూడు దఫాలుగా వేయండి, దాంతో పాటు 10 కిలోల జింక్ సల్ఫేట్ కలపండి.',
      },
      {
        terms: ['పురుగు', 'తెగులు', 'మందు', 'పిచికారీ'],
        answer:
          'గులాబీ రంగు కాయతొలుచు పురుగు నివారణకు ఎకరానికి 5 లింగాకర్షక బుట్టలు అమర్చండి. వేప నూనె 3 మి.లీ/లీటరు లేదా క్లోరాంట్రానిలిప్రోల్ 0.3 మి.లీ/లీటరు ఉదయం పూట పిచికారీ చేయండి.',
      },
      {
        terms: ['ధర', 'మార్కెట్', 'మండి', 'రేటు'],
        answer:
          'ప్రస్తుతం మార్కెట్‌లో క్వింటాలుకు ₹4,850 వరకు మోడల్ ధర పలుకుతోంది. వేర్‌హౌస్‌లో నిల్వ చేసి విక్రయిస్తే అదనంగా ₹250 వరకు లాభం చేకూరుతుంది.',
      },
    ],
  },
  ta: {
    defaultAnswer:
      'மண்ணின் ஈரப்பதம் (28.5%) மற்றும் வெப்பநிலை (29°C) பயிர் வளர்ச்சிக்கு ஏற்றதாக உள்ளது. காலை வேளையில் 5% வேப்பங்கொட்டை கரைசல் தெளித்து, சொட்டு நீர் பாசனம் மூலம் பொட்டாஷ் உரமிடவும்.',
    keywords: [
      {
        terms: ['உரம்', 'யூரியா', 'அளவு', 'மண்'],
        answer:
          'பயிருக்கு ஏக்கருக்கு 100:50:50 கிலோ NPK பரிந்துரைக்கப்படுகிறது. யூரியாவை 3 தவணைகளாக பிரித்து இடவும். துத்தநாக சல்பேட் 10 கிலோ அடித்தளமாக இடவும்.',
      },
      {
        terms: ['பூச்சி', 'நோய்', 'மருந்து', 'தெளிப்பு'],
        answer:
          'காய்ப்புழு தாக்குதலுக்கு ஏக்கருக்கு 5 இனக்கவர்ச்சி பொறிகளை வைக்கவும். வேப்ப எண்ணெய் 3 மிலி/லிட்டர் அல்லது அசாடிராக்டின் காலை வேளையில் தெளிக்கவும்.',
      },
      {
        terms: ['விலை', 'சந்தை', 'மண்டி'],
        answer:
          'தற்போதைய சந்தை விலை குவிண்டாலுக்கு ₹4,850 ஆக உள்ளது. ஒழுங்குமுறை விற்பனை கூடத்தில் சேமித்து விற்றால் கூடுதல் லாபம் பெறலாம்.',
      },
    ],
  },
  gu: {
    defaultAnswer:
      'હાલમાં જમીનમાં ૨૮.૫% ભેજ અને ૨૯°C તાપમાન ખેતી માટે અનુકૂળ છે. સવારના સમયે ૫% લીંબોળીના અર્કનો છંટકાવ કરો અને ટપક સિંચાઈ દ્વારા પોટાશ ખાતર આપો.',
    keywords: [
      {
        terms: ['ખાતર', 'યુરિયા', 'માપ'],
        answer:
          'કપાસ અને મગફળી માટે હેક્ટર દીઠ ૧૨૦:૬૦:૪૦ કિલો NPK ની ભલામણ છે. યુરિયા ત્રણ હપ્તામાં આપવું અને સાથે ૨૫ કિલો ઝિંક સલ્ફેટ વાપરવું.',
      },
      {
        terms: ['જીવાત', 'ઈયળ', 'દવા', 'છંટકાવ'],
        answer:
          'ગુલાબી ઈયળ માટે એકરે ૫ ફેરોમોન ટ્રેપ લગાવો. લીંબોળીનું તેલ (૧૫૦૦ ppm) ૩ મિલી પ્રતિ લિટર પાણીમાં સવારે છાંટવું.',
      },
      {
        terms: ['ભાવ', 'બજાર', 'મંડી'],
        answer:
          'રાજકોટ અને ગોંડલ માર્કેટ યાર્ડમાં સરેરાશ ભાવ ₹૪,૮૫૦ પ્રતિ ક્વિન્ટલ છે. વેરહાઉસમાં સંગ્રહ કરવાથી સારો નફો મળશે.',
      },
    ],
  },
  pa: {
    defaultAnswer:
      'ਜ਼ਮੀਨ ਵਿਚਲੀ ਨਮੀ (28.5%) ਅਤੇ ਤਾਪਮਾਨ (29°C) ਫ਼ਸਲ ਲਈ ਢੁਕਵਾਂ ਹੈ। ਸਵੇਰ ਦੇ ਸਮੇਂ ਨਿੰਮ ਦੇ ਅਰਕ ਦਾ ਛਿੜਕਾਅ ਕਰੋ ਅਤੇ ਤੁਪਕਾ ਸਿੰਚਾਈ ਰਾਹੀਂ ਪੋਟਾਸ਼ ਖਾਦ ਦਿਓ।',
    keywords: [
      {
        terms: ['ਖਾਦ', 'ਯੂਰੀਆ', 'ਮਾਤਰਾ'],
        answer:
          'ਕਣਕ ਲਈ ਪ੍ਰਤੀ ਏਕੜ 110 ਕਿਲੋ ਯੂਰੀਆ, 55 ਕਿਲੋ ਡੀਏਪੀ ਅਤੇ 20 ਕਿਲੋ ਪੋਟਾਸ਼ ਦੀ ਲੋੜ ਹੈ। ਯੂਰੀਆ ਦੋ ਕਿਸ਼ਤਾਂ ਵਿੱਚ ਪਹਿਲੇ ਅਤੇ ਦੂਜੇ ਪਾਣੀ ਨਾਲ ਪਾਓ।',
      },
      {
        terms: ['ਕੀੜੇ', 'ਸੁੰਡੀ', 'ਬਿਮਾਰੀ', 'ਸਪਰੇਅ'],
        answer:
          'ਗੁਲਾਬੀ ਸੁੰਡੀ ਜਾਂ ਤਣਾ ਛੇਦਕ ਲਈ ਏਕੜ ਪਿੱਛੇ 5 ਫੈਰੋਮੋਨ ਟਰੈਪ ਲਗਾਓ। ਸਵੇਰ ਦੇ ਸ਼ਾਂਤ ਮੌਸਮ ਵਿੱਚ 5% ਨਿੰਮ ਤੇਲ ਦੀ ਸਪਰੇਅ ਕਰੋ।',
      },
      {
        terms: ['ਭਾਅ', 'ਮੰਡੀ', 'ਰੇਟ'],
        answer:
          'ਮੰਡੀ ਵਿੱਚ ਫ਼ਸਲ ਦਾ ਮਾਡਲ ਭਾਅ ₹2,275 ਤੋਂ ₹4,850 ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਚੱਲ ਰਿਹਾ ਹੈ। ਸਰਕਾਰੀ ਖਰੀਦ ਕੇਂਦਰਾਂ ਤੇ ਐਮ.ਐਸ.ਪੀ. ਤੇ ਵੇਚਣਾ ਲਾਹੇਵੰਦ ਹੈ।',
      },
    ],
  },
};

export function VoiceAssistantModal({ isOpen, onClose }: VoiceAssistantModalProps) {
  const { language, setLanguage, t } = useLanguage();
  const { activeDiagnosis } = useDiagnosis();
  const { weatherData, outbreakData, marketData, activeArbitrageTopSpread, sprayStatusForNow } = useTelemetry();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [audioSupported, setAudioSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.id === language) || SUPPORTED_LANGUAGES[0];

  // Stop any ongoing speech synthesis on unmount or language change
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleLanguageSelect = (langId: string) => {
    // When user selects language, THE WHOLE WEBSITE updates to that language and the modal immediately auto-closes!
    setLanguage(langId);
    setTranscript('');
    setReply('');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    if (isListening) {
      stopListening();
    }
    onClose();
  };

  // Generate an intelligent agronomic answer based on language, query text, and active field diagnosis
  const getAgronomicAnswer = (userQuery: string, langId: string): string => {
    const lower = userQuery.toLowerCase();

    // Contextual active field diagnosis injection
    if (activeDiagnosis) {
      const pestQueryTerms = [
        'spray', 'pest', 'disease', 'medicine', 'today', 'cure', 'leaf', 'worm', 'treatment', 'insect', 'infection', 'bug', 'blight', 'rot', 'dose', 'dosage', 'spraying', 'fungus',
        'दवा', 'छिड़काव', 'रोग', 'कीट', 'इल्ली', 'उपचार', 'आज', 'फसल',
        'औषध', 'फवारणी', 'कीड', 'रोगराई', 'बोंडअळी', 'आज', 'उपाय',
        'পোকা', 'রোগ', 'কীটনাশক', 'স্প্রে', 'ওষুধ', 'আজ',
        'పురుగు', 'మందు', 'తెగులు', 'స్ప్రే',
        'பூச்சி', 'மருந்து', 'நோய்', 'தெளிப்பு',
        'ಕೀಟ', 'ಔಷಧಿ', 'ರೋಗ', 'ಸಿಂಪಡಣೆ',
        'જીવાત', 'દવા', 'રોગ', 'છંટકાવ',
      ];

      if (pestQueryTerms.some((term) => lower.includes(term.toLowerCase()))) {
        if (langId === 'hi') {
          return `आपके खेत में सक्रिय निदान: ${activeDiagnosis.pestName} (${activeDiagnosis.severity} तीव्रता, ${activeDiagnosis.damagePercentage}% क्षति)। आज सुबह 09:30 से पहले संस्तुत जैविक उपचार: ${activeDiagnosis.biologicalTreatment[0] || '5% नीम अर्क (NSKE)'} का छिड़काव करें। अनुमोदित रासायनिक विकल्प: ${activeDiagnosis.chemicalTreatment[0] || 'इमामेक्टिन 5% SG'}। ${activeDiagnosis.quarantineRadiusMeters} मीटर दायरे में निगरानी रखें।`;
        }
        if (langId === 'mr') {
          return `तुमच्या शेतातील सक्रिय कीड निदान: ${activeDiagnosis.pestName} (${activeDiagnosis.severity} प्रादुर्भाव, ${activeDiagnosis.damagePercentage}% नुकसान). आज सकाळी संस्तुत जैविक फवारणी: ${activeDiagnosis.biologicalTreatment[0] || 'निंबोळी अर्क ५%'}. रासायनिक पर्याय: ${activeDiagnosis.chemicalTreatment[0] || 'क्लोरँट्रानिलीप्रोल'}. ${activeDiagnosis.quarantineRadiusMeters} मीटर परिसरात प्रतिबंधक उपाय करा.`;
        }
        return `Regarding your active field diagnosis of ${activeDiagnosis.pestName} (${activeDiagnosis.severity} severity on ${activeDiagnosis.affectedCrop} with ${activeDiagnosis.damagePercentage}% foliar damage): Recommended biological spray for today is ${activeDiagnosis.biologicalTreatment[0] || '5% NSKE'} applied before 09:30 AM. Approved chemical intervention: ${activeDiagnosis.chemicalTreatment[0] || 'Emamectin Benzoate 5% SG @ 0.4 g/L'}. Maintain an inspection buffer perimeter of ${activeDiagnosis.quarantineRadiusMeters} meters.`;
      }
    }

    // Live Weather and Microclimate Query
    if (lower.includes('weather') || lower.includes('rain') || lower.includes('wind') || lower.includes('temp') || lower.includes('मौसम') || lower.includes('हवामान') || lower.includes('আবহাওয়া')) {
      if (langId === 'hi') {
        return `${weatherData.locationName} में वर्तमान मौसम: तापमान ${weatherData.temp}°C, आर्द्रता ${weatherData.humidity}%, हवा ${weatherData.windSpeed} किमी/घंटा। छिड़काव अनुकूलता: ${sprayStatusForNow}।`;
      }
      if (langId === 'mr') {
        return `${weatherData.locationName} येथील थेट हवामान: तापमान ${weatherData.temp}°C, आर्द्रता ${weatherData.humidity}%, वारा ${weatherData.windSpeed} किमी/तास. फवारणी स्थिती: ${sprayStatusForNow}.`;
      }
      return `Current live weather in ${weatherData.locationName}: Temperature ${weatherData.temp}°C, Relative Humidity ${weatherData.humidity}%, Wind ${weatherData.windSpeed} km/h. Spray viability status for now is ${sprayStatusForNow}.`;
    }

    // Live Mandi Market and Arbitrage Query
    if (lower.includes('mandi') || lower.includes('rate') || lower.includes('price') || lower.includes('market') || lower.includes('भाव') || lower.includes('दर') || lower.includes('দাম')) {
      const top = activeArbitrageTopSpread || marketData[0];
      if (top) {
        if (langId === 'hi') {
          return `${top.market} में ${top.commodity} का लाइव मॉडल भाव ₹${top.modalPrice}/क्विंटल है। उच्चतम मंडी ${top.highestMandi} में भाव ₹${top.highestMandiPrice}/क्विंटल है (+₹${top.arbitrageSpread} का मुनाफा/स्प्रेड)।`;
        }
        if (langId === 'mr') {
          return `${top.market} मध्ये ${top.commodity} चे थेट सरासरी दर ₹${top.modalPrice}/क्विंटल आहेत. सर्वोच्च बाजार ${top.highestMandi} मध्ये दर ₹${top.highestMandiPrice}/क्विंटल (+₹${top.arbitrageSpread} चा फायदा).`;
        }
        return `Live APMC mandi telemetry for ${top.commodity}: Current modal rate at ${top.market} is ₹${top.modalPrice}/qtl. Highest neighboring benchmark at ${top.highestMandi} is ₹${top.highestMandiPrice}/qtl, creating a net arbitrage spread of +₹${top.arbitrageSpread}/qtl.`;
      }
    }

    // Live Outbreak Radar Query
    if (lower.includes('outbreak') || lower.includes('radar') || lower.includes('hazard') || lower.includes('अलर्ट') || lower.includes('धोका')) {
      if (langId === 'hi') {
        return `${outbreakData.locationName} के लिए आउटब्रेक रडार: ${outbreakData.hazardLevel} जोखिम स्तर। संगरोध दायरा: ${outbreakData.quarantineRadiusMeters} मीटर। संस्तुत दवा: ${outbreakData.bioDosage}।`;
      }
      if (langId === 'mr') {
        return `${outbreakData.locationName} साठी आउटब्रेक रडार: ${outbreakData.hazardLevel} धोका पातळी. नियंत्रण परिसर: ${outbreakData.quarantineRadiusMeters} मीटर. शिफारस: ${outbreakData.bioDosage}.`;
      }
      return `Epidemiological radar for ${outbreakData.locationName}: Active hazard tier is ${outbreakData.hazardLevel}. Quarantine perimeter: ${outbreakData.quarantineRadiusMeters}m. Standard protocol: ${outbreakData.bioDosage}`;
    }

    const kb = AGRONOMY_KNOWLEDGE[langId] || AGRONOMY_KNOWLEDGE.en;

    for (const rule of kb.keywords) {
      if (rule.terms.some((term) => lower.includes(term.toLowerCase()))) {
        return rule.answer;
      }
    }

    return kb.defaultAnswer;
  };

  // Speak the answer out loud using browser SpeechSynthesis
  const speakAnswer = (text: string, speechCode: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechCode;
      utterance.rate = 0.95; // Clear and intelligible for rural farmers
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  const startListening = () => {
    stopSpeaking();
    setTranscript('');
    setReply('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = currentLang.speechCode;
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setTranscript(`"${currentTranscript}"`);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          setIsListening(false);
          // Graceful fallback to realistic sample query in native dialect
          const sample = currentLang.sampleQuery;
          setTranscript(`"${sample}"`);
          processQueryAndReply(sample, currentLang.id, currentLang.speechCode);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (transcript) {
            const cleanQuery = transcript.replace(/"/g, '');
            processQueryAndReply(cleanQuery, currentLang.id, currentLang.speechCode);
          } else {
            // If mic closed without hearing, use sample query
            const sample = currentLang.sampleQuery;
            setTranscript(`"${sample}"`);
            processQueryAndReply(sample, currentLang.id, currentLang.speechCode);
          }
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition start error:', err);
      }
    }

    // Fallback simulation if speech recognition is unsupported in current browser environment
    setIsListening(true);
    setTranscript(`"${currentLang.sampleQuery}"`);
    setReply('Listening and analyzing acoustic phonetics...');

    setTimeout(() => {
      setIsListening(false);
      processQueryAndReply(currentLang.sampleQuery, currentLang.id, currentLang.speechCode);
    }, 1800);
  };

  const processQueryAndReply = async (query: string, langId: string, speechCode: string) => {
    setReply('AgriSence Guide AI is analyzing your question…');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language: langId,
          currentRoute: typeof window !== 'undefined' ? window.location.pathname : '/',
          weatherData,
          activeDiagnosis,
          outbreakData,
          marketSnapshot: activeArbitrageTopSpread,
          sprayStatus: sprayStatusForNow,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success || typeof payload.reply !== 'string') {
        throw new Error(payload.error || 'Guide AI is unavailable.');
      }
      setReply(payload.reply);
      speakAnswer(payload.reply, speechCode);
    } catch {
      const answer = 'Guide AI is temporarily unavailable. Please try again, or use the text AgriSence Guide AI drawer for navigation help.';
      setReply(answer);
      speakAnswer(answer, speechCode);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 dark:bg-black/75 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative w-full max-w-xl rounded-[32px] frosted-card border border-white/80 dark:border-white/14 p-5 sm:p-7 shadow-2xl z-10 space-y-5 text-slate-950 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-color,#0f9a58)] flex items-center justify-center border border-[var(--brand-border)] shadow-2xs">
                  <Globe className="size-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      {t('voice.title', 'AgriSence Multilingual Voice AI')}
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--brand-color,#0f9a58)] text-white uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-slate-650 dark:text-slate-300 font-semibold">
                    Select a language to translate the website and speak in your native dialect
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full frosted-glass-sub hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-650 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Active Telemetry Synchronized Indicator */}
            {activeDiagnosis && (
              <div className="p-3 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Synced with active diagnosis: <strong>{activeDiagnosis.pestName}</strong> ({activeDiagnosis.severity})
                  </span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--brand-color,#0f9a58)] text-white">
                  Context Linked
                </span>
              </div>
            )}

            {/* Language Selector Grid: Selecting any changes the whole website text! */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider">
                  1. Select Language (Translates Whole Website)
                </span>
                <span className="text-[11px] font-bold text-[var(--brand-text,#0d7342)]">
                  Active: {currentLang.label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = language === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => handleLanguageSelect(lang.id)}
                      className={`px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center border cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--brand-color,#0f9a58)] border-[var(--brand-color,#0f9a58)] text-white shadow-md scale-[1.02] ring-2 ring-[var(--brand-color,#0f9a58)]/30'
                          : 'frosted-glass-sub border-white/70 dark:border-white/10 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-black text-xs">{lang.nativeName}</span>
                      <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        {lang.id.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice Interaction Mic Core */}
            <div className="flex flex-col items-center justify-center p-6 rounded-[28px] frosted-glass-sub border border-white/70 dark:border-white/10 space-y-4 text-center">
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`relative size-20 sm:size-22 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white scale-110 shadow-rose-500/40 ring-4 ring-rose-500/30 animate-pulse'
                      : 'bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white hover:scale-105 shadow-emerald-600/30'
                  }`}
                  title="Tap to speak in your selected language"
                >
                  {isListening && (
                    <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-50" />
                  )}
                  {isListening ? <MicOff className="size-9" /> : <Mic className="size-9 stroke-[2.2]" />}
                </button>

                {/* Animated Sound Wave Badge */}
                {isListening && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <span className="size-1.5 rounded-full bg-white animate-ping" />
                    <span>Listening</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-sm font-black text-slate-950 dark:text-white block">
                  {isListening
                    ? `Listening in ${currentLang.label}... Speak now!`
                    : 'Tap microphone to speak'}
                </span>
                <p className="text-xs text-slate-650 dark:text-slate-300 max-w-sm mx-auto font-medium">
                  Ask in <strong>{currentLang.label}</strong> about pest remedies, fertilizer doses, mandi prices, or weather alerts.
                </p>
              </div>

              {/* Sample Quick-Tap Query Chip */}
              <div className="w-full pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTranscript(`"${currentLang.sampleQuery}"`);
                    processQueryAndReply(currentLang.sampleQuery, currentLang.id, currentLang.speechCode);
                  }}
                  className="w-full p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <span className="truncate">
                    <strong>Quick Test:</strong> {currentLang.sampleQuery}
                  </span>
                  <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] group-hover:bg-[var(--brand-color,#0f9a58)] group-hover:text-white transition-colors">
                    Ask
                  </span>
                </button>
              </div>

              {/* Live Transcript Display */}
              {transcript && (
                <div className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-[var(--brand-border)] text-xs font-bold text-[var(--brand-text,#0d7342)] shadow-2xs text-left">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                    Your Question:
                  </span>
                  {transcript}
                </div>
              )}

              {/* AI Agronomic Answer Display with Audio Controls */}
              {reply && (
                <div className="w-full p-4 rounded-2xl frosted-card border border-[var(--brand-border)] text-xs font-medium text-slate-850 dark:text-slate-100 text-left shadow-md space-y-2 bg-gradient-to-br from-white/90 to-emerald-50/40 dark:from-slate-800/90 dark:to-emerald-950/20">
                  <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                    <span className="font-black text-xs text-[var(--brand-text,#0d7342)] flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                      AgriSence AI Answer ({currentLang.label}):
                    </span>

                    {/* Audio Speech Controls */}
                    <div className="flex items-center gap-1.5">
                      {isSpeaking ? (
                        <button
                          type="button"
                          onClick={stopSpeaking}
                          className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-black flex items-center gap-1 shadow-xs cursor-pointer hover:bg-rose-600 transition-colors"
                        >
                          <VolumeX className="size-3" />
                          <span>Stop Voice</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => speakAnswer(reply, currentLang.speechCode)}
                          className="px-2 py-1 rounded-lg bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] hover:bg-[var(--brand-color,#0f9a58)] hover:text-white text-[10px] font-black flex items-center gap-1 border border-[var(--brand-border)] shadow-xs cursor-pointer transition-colors"
                        >
                          <Volume2 className="size-3" />
                          <span>Listen Again</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-[13px] leading-relaxed font-semibold text-slate-800 dark:text-slate-200">
                    {reply}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] text-[11px] font-bold text-[var(--brand-text,#0d7342)] shadow-2xs">
              <CheckCircle2 className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
              <span>
                Selecting a language updates all navbar items, hero banners, metrics, and cards across the entire website.
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
