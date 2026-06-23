const TRIVIA_ROUND_STORAGE_PREFIX = "nehaTriviaRound";
const TRIVIA_ROUND_SIZE = 12;
const APP_ALERT_SNOOZE_MS = 2 * 60 * 60 * 1000;

const state = {
  sessions: [],
  guide: null,
  day: "all",
  category: "all",
  status: "all",
  query: "",
  aiQuery: "",
  activeView: "my",
  alerts: [],
  alertIndex: Number(localStorage.getItem("nehaAlertIndex") || 0),
  alertSnoozeUntil: Number(localStorage.getItem("nehaAlertSnoozeUntil") || 0),
  reminders: JSON.parse(localStorage.getItem("nehaSessionReminders") || "{}"),
  scheduleSyncTimer: null,
  scheduleSyncInFlight: false,
  scheduleSyncPending: false,
  reminderAlert: null,
  myDay: "",
  myMode: "day",
  placeFilter: "all",
  venueMap: "exhibit",
  communityCategory: "all",
  communityPosts: [],
  communityLoading: false,
  communityLoaded: false,
  communityImage: null,
  presentations: {},
  sessionNotes: JSON.parse(localStorage.getItem("nehaSessionNotes") || "{}"),
  sessionThreads: {},
  sessionTool: {
    sessionId: null,
    tab: "presentations",
    loading: false
  },
  pendingConflict: null,
  installPrompt: null,
  triviaBoard: localStorage.getItem("nehaTriviaBoard") || "food",
  trivia: {
    index: 0,
    score: 0,
    selected: null,
    answered: false,
    complete: false,
    streak: 0,
    hintsRemaining: 3,
    hidden: {},
    submitted: false,
    submitting: false,
    leaderboard: [],
    leaderboardLoading: false,
    leaderboardError: "",
    order: [],
    questionIndexes: [],
    best: Number(localStorage.getItem("nehaTriviaBest") || 0),
    roundId: "",
    startedAt: "",
    completedAt: "",
    ...loadStoredTriviaRound()
  },
  drinkTicket: JSON.parse(localStorage.getItem("nehaDrinkTicket") || "null"),
  drinkValidation: {
    code: new URLSearchParams(location.search).get("drinkCode") || "",
    loading: false,
    error: "",
    ticket: null
  },
  lead: JSON.parse(localStorage.getItem("nehaLead") || "null"),
  saved: JSON.parse(localStorage.getItem("nehaSaved") || '{"watch":{},"attend":{}}')
};

const els = {
  leadGate: document.querySelector("#leadGate"),
  leadForm: document.querySelector("#leadForm"),
  leadName: document.querySelector("#leadName"),
  leadAgency: document.querySelector("#leadAgency"),
  leadEmail: document.querySelector("#leadEmail"),
  leadNote: document.querySelector("#leadNote"),
  title: document.querySelector("#viewTitle"),
  searchWrap: document.querySelector(".search-wrap"),
  search: document.querySelector("#searchInput"),
  appAlerts: document.querySelector("#appAlerts"),
  dayTabs: document.querySelector("#dayTabs"),
  category: document.querySelector("#categorySelect"),
  status: document.querySelector("#statusSelect"),
  metrics: document.querySelector("#metricsRow"),
  nowNext: document.querySelector("#nowNext"),
  sessionList: document.querySelector("#sessionList"),
  myList: document.querySelector("#myList"),
  mySummary: document.querySelector("#mySummary"),
  myModeTabs: document.querySelector("#myModeTabs"),
  mySavedPanel: document.querySelector("#mySavedPanel"),
  myBrowsePanel: document.querySelector("#myBrowsePanel"),
  myAiPanel: document.querySelector("#myAiPanel"),
  myAiAnswer: document.querySelector("#myAiAnswer"),
  myAiReasons: document.querySelector("#myAiReasons"),
  myAiResults: document.querySelector("#myAiResults"),
  myDayTabs: document.querySelector("#myDayTabs"),
  myDailyGrid: document.querySelector("#myDailyGrid"),
  emailSchedule: document.querySelector("#emailSchedule"),
  conflictBanner: document.querySelector("#conflictBanner"),
  aiForm: document.querySelector("#aiForm"),
  aiPrompt: document.querySelector("#aiPrompt"),
  aiAnswer: document.querySelector("#aiAnswer"),
  aiResults: document.querySelector("#aiResults"),
  aiReasons: document.querySelector("#aiReasons"),
  placeFilter: document.querySelector("#placeFilter"),
  placeGrid: document.querySelector("#placeGrid"),
  kcSourceLinks: document.querySelector("#kcSourceLinks"),
  hotelTips: document.querySelector("#hotelTips"),
  venueMapTabs: document.querySelector("#venueMapTabs"),
  venueMapImage: document.querySelector("#venueMapImage"),
  venueMapCaption: document.querySelector("#venueMapCaption"),
  podcastGrid: document.querySelector("#podcastGrid"),
  communityCategories: document.querySelector("#communityCategories"),
  communityForm: document.querySelector("#communityForm"),
  communityCategoryInput: document.querySelector("#communityCategoryInput"),
  communityTitle: document.querySelector("#communityTitle"),
  communityMessage: document.querySelector("#communityMessage"),
  communityImageField: document.querySelector("#communityImageField"),
  communityImageLabel: document.querySelector("#communityImageLabel"),
  communityImageFile: document.querySelector("#communityImageFile"),
  communityImagePreview: document.querySelector("#communityImagePreview"),
  communityShareEmail: document.querySelector("#communityShareEmail"),
  communityStatus: document.querySelector("#communityStatus"),
  communityPosts: document.querySelector("#communityPosts"),
  demoForm: document.querySelector("#demoForm"),
  demoName: document.querySelector("#demoName"),
  demoAgency: document.querySelector("#demoAgency"),
  demoEmail: document.querySelector("#demoEmail"),
  demoPhone: document.querySelector("#demoPhone"),
  demoState: document.querySelector("#demoState"),
  demoNotes: document.querySelector("#demoNotes"),
  demoStatus: document.querySelector("#demoStatus"),
  triviaBoardEyebrow: document.querySelector("#triviaBoardEyebrow"),
  triviaBoardDescription: document.querySelector("#triviaBoardDescription"),
  triviaBoardPicker: document.querySelector("#triviaBoardPicker"),
  triviaScore: document.querySelector("#triviaScore"),
  triviaProgressBar: document.querySelector("#triviaProgressBar"),
  triviaStage: document.querySelector("#triviaStage"),
  installAppButton: document.querySelector("#installAppButton"),
  moreMenuButton: document.querySelector("#moreMenuButton"),
  moreMenu: document.querySelector("#moreMenu"),
  freeDrinkButton: document.querySelector("#freeDrinkButton"),
  drinkQr: document.querySelector("#drinkQr"),
  drinkValidator: document.querySelector("#drinkValidator"),
  freeDrinkStatus: document.querySelector("#freeDrinkStatus"),
  watchCount: document.querySelector("#watchCount"),
  attendCount: document.querySelector("#attendCount"),
  sessionToolModal: document.querySelector("#sessionToolModal"),
  sessionToolClose: document.querySelector("#sessionToolClose"),
  installHelpModal: document.querySelector("#installHelpModal"),
  installHelpClose: document.querySelector("#installHelpClose"),
  installHelpSteps: document.querySelector("#installHelpSteps"),
  sessionToolTitle: document.querySelector("#sessionToolTitle"),
  sessionToolMeta: document.querySelector("#sessionToolMeta"),
  sessionToolTabs: document.querySelector("#sessionToolTabs"),
  sessionPresentationPanel: document.querySelector("#sessionPresentationPanel"),
  sessionNotesPanel: document.querySelector("#sessionNotesPanel"),
  sessionNotesInput: document.querySelector("#sessionNotesInput"),
  sessionNotesSave: document.querySelector("#sessionNotesSave"),
  sessionNotesStatus: document.querySelector("#sessionNotesStatus"),
  sessionNotesEmailForm: document.querySelector("#sessionNotesEmailForm"),
  sessionNotesEmail: document.querySelector("#sessionNotesEmail"),
  sessionNotesEmailSend: document.querySelector("#sessionNotesEmailSend"),
  sessionNotesEmailStatus: document.querySelector("#sessionNotesEmailStatus"),
  sessionQuestionsPanel: document.querySelector("#sessionQuestionsPanel"),
  sessionQuestionForm: document.querySelector("#sessionQuestionForm"),
  sessionQuestionTitle: document.querySelector("#sessionQuestionTitle"),
  sessionQuestionMessage: document.querySelector("#sessionQuestionMessage"),
  sessionQuestionStatus: document.querySelector("#sessionQuestionStatus"),
  sessionQuestionThreads: document.querySelector("#sessionQuestionThreads")
};

const viewTitles = {
  schedule: "MyNEHA Dashboard",
  my: "MyNEHA Dashboard",
  ai: "AI Session Guide",
  kc: "Fun in KC",
  venue: "Venue Navigator",
  podcast: "Beyond Data Management",
  community: "Community Connect",
  demo: "Book an HS CloudSuite Demo",
  trivia: "EH Trivia Game",
  drink: "FREE DRINK"
};

const fallbackAppAlerts = [
  {
    label: "Trivia Prize",
    title: "Perfect scores win prizes",
    message: "Finish 12 for 12 in EH Trivia, then visit the HS GovTech booth for a special prize.",
    action: "Play Trivia",
    view: "trivia"
  },
  {
    label: "HS CloudSuite",
    title: "Want a closer look?",
    message: "Book a quick HS CloudSuite demo and someone will reach out after NEHA.",
    action: "Book Demo",
    view: "demo"
  }
];

const communityCategories = [
  { id: "all", label: "All Threads" },
  { id: "unique-problems", label: "Unique Problems" },
  { id: "eh-friends", label: "Meet New EH Friends" },
  { id: "kc-images", label: "Images of Kansas City" },
  { id: "find-violation", label: "Find the Violation" },
  { id: "ask-community", label: "Ask the Community" }
];

const podcastEpisodes = [
  {
    id: "ZVCYECYqdss",
    title: "A First Look at Wiley: AFDO's New AI - Ep38 Jason Brill",
    url: "https://www.youtube.com/watch?v=ZVCYECYqdss",
    thumbnail: "https://i3.ytimg.com/vi/ZVCYECYqdss/hqdefault.jpg",
    published: "Jun 15, 2026",
    description: "AFDO's Jason Brill joins Beyond Data Management for a look at Wiley, a new AI tool for food safety and health regulators."
  },
  {
    id: "aK-9_umXkFk",
    title: "Steve Mandernach previews AFDO 26 and discusses AI, FDA Collaboration, and the Future of Food Safety",
    url: "https://www.youtube.com/watch?v=aK-9_umXkFk",
    thumbnail: "https://i2.ytimg.com/vi/aK-9_umXkFk/hqdefault.jpg",
    published: "Jun 1, 2026",
    description: "Cameron Garrison and AFDO Executive Director Steve Mandernach discuss inspections, training, AI, FSMA, and the future of food safety."
  },
  {
    id: "cHmadBE2If0",
    title: "Traumatic Insemination: Bed Bugs Are Even Grosser Than You Imagined",
    url: "https://www.youtube.com/watch?v=cHmadBE2If0",
    thumbnail: "https://i4.ytimg.com/vi/cHmadBE2If0/hqdefault.jpg",
    published: "Apr 21, 2026",
    description: "Dr. Aaron Ashbrook breaks down bed bug science and what environmental health professionals should know."
  },
  {
    id: "Y-_L57-e98g",
    title: "\"I Just Remembered I Have to Take This Call\" - Smart De-Escalation Tricks for Regulators",
    url: "https://www.youtube.com/watch?v=Y-_L57-e98g",
    thumbnail: "https://i2.ytimg.com/vi/Y-_L57-e98g/hqdefault.jpg",
    published: "Apr 14, 2026",
    description: "Alicia Love shares practical de-escalation approaches for regulators in tense field situations."
  }
];

const triviaBoards = {
  food: {
    id: "food",
    label: "Food Code",
    shortLabel: "Food",
    eyebrow: "2022 FDA Food Code Challenge",
    description: "Perfect scores win a prize. Test your retail food safety instincts with twelve quick questions, instant feedback, and brag-worthy achievement levels.",
    sourceNote: "Food Code note",
    bestKey: "nehaTriviaBestFood",
    legacyBestKey: "nehaTriviaBest",
    questions: [
      {
        section: "2-301.12",
        category: "Hands",
        question: "Food employees must clean their hands and exposed portions of arms for at least how long?",
        options: ["20 seconds", "10 seconds", "45 seconds", "Only until visibly clean"],
        answer: 0,
        explanation: "Section 2-301.12 sets a minimum 20-second handwashing procedure."
      },
      {
        section: "3-501.16",
        category: "Cold Holding",
        question: "Cold-held TCS food should generally be maintained at what temperature?",
        options: ["41°F or less", "45°F or less", "50°F or less", "32°F exactly"],
        answer: 0,
        explanation: "Cold holding for TCS food is generally 41°F or less."
      },
      {
        section: "3-501.16",
        category: "Hot Holding",
        question: "Hot-held TCS food should generally be maintained at what temperature?",
        options: ["135°F or above", "120°F or above", "145°F or above", "165°F or above"],
        answer: 0,
        explanation: "Hot holding for TCS food is generally 135°F or above."
      },
      {
        section: "3-401.11",
        category: "Cooking",
        question: "Poultry, baluts, stuffed fish, stuffed meat, and stuffed pasta must be cooked to what minimum temperature?",
        options: ["165°F", "155°F", "145°F", "135°F"],
        answer: 0,
        explanation: "The Food Code places poultry and stuffed foods in the 165°F minimum cooking group."
      },
      {
        section: "3-401.11",
        category: "Cooking",
        question: "Comminuted meat, such as ground beef, is commonly associated with which minimum cooking temperature?",
        options: ["155°F", "145°F", "165°F", "135°F"],
        answer: 0,
        explanation: "Comminuted meat is in the 155°F minimum cooking group."
      },
      {
        section: "3-501.14",
        category: "Cooling",
        question: "Cooked TCS food must cool from 135°F to 70°F within 2 hours, and then to 41°F or less within what total time?",
        options: ["6 hours total", "4 hours total", "8 hours total", "24 hours total"],
        answer: 0,
        explanation: "Cooling is 135°F to 70°F within 2 hours and 135°F to 41°F or less within a total of 6 hours."
      },
      {
        section: "3-501.17",
        category: "Date Marking",
        question: "Refrigerated, ready-to-eat TCS food held at 41°F or less is generally date marked for no more than how many days?",
        options: ["7 days", "3 days", "10 days", "14 days"],
        answer: 0,
        explanation: "The maximum is generally 7 days, counting the preparation or opening day as day 1."
      },
      {
        section: "3-301.11",
        category: "Contamination",
        question: "Which practice is generally prohibited with ready-to-eat food?",
        options: ["Bare-hand contact", "Using deli tissue", "Using single-use gloves", "Using dispensing utensils"],
        answer: 0,
        explanation: "Food employees may not contact exposed ready-to-eat food with bare hands except as allowed by the Code."
      },
      {
        section: "2-201.11",
        category: "Employee Health",
        question: "Which symptom should a food employee report to the person in charge?",
        options: ["Vomiting", "A mild headache only", "Seasonal allergies only", "Tired feet after a long shift"],
        answer: 0,
        explanation: "Vomiting, diarrhea, jaundice, sore throat with fever, and infected lesions are among key reportable items."
      },
      {
        section: "3-603.11",
        category: "Consumer Advisory",
        question: "A consumer advisory is tied to which menu situation?",
        options: ["Raw or undercooked animal foods offered for consumption", "Any food served cold", "All packaged bottled drinks", "Only foods with added sugar"],
        answer: 0,
        explanation: "Consumer advisories apply when raw or undercooked animal foods are offered in ready-to-eat form."
      },
      {
        section: "1-201.10",
        category: "Allergens",
        question: "Which food was added as a major food allergen in the 2022 Food Code era?",
        options: ["Sesame", "Rice", "Chicken", "Tomato"],
        answer: 0,
        explanation: "Sesame joins the major food allergen list reflected in the 2022 Food Code materials."
      },
      {
        section: "3-203.12",
        category: "Shellfish",
        question: "Shellstock tags or labels must generally be kept for how long after the container is emptied?",
        options: ["90 days", "7 days", "30 days", "1 year"],
        answer: 0,
        explanation: "Shellstock tags are retained for 90 calendar days after the container is emptied."
      },
      {
        section: "2-401.11",
        category: "Employee Practices",
        question: "Where should an employee drink be stored during food preparation?",
        options: ["Where it cannot contaminate food, equipment, utensils, or single-service items", "On the prep table if it has a lid", "Inside a reach-in cooler above ready-to-eat food", "Anywhere if the employee is careful"],
        answer: 0,
        explanation: "Employee drinks must be handled and located to prevent contamination of food and food-contact surfaces."
      },
      {
        section: "2-402.11",
        category: "Employee Practices",
        question: "What is the main food-safety purpose of hair restraints?",
        options: ["To keep hair from contacting exposed food and clean equipment", "To identify the manager on duty", "To replace handwashing", "To keep employees warmer in cold rooms"],
        answer: 0,
        explanation: "Hair restraints help prevent hair from contacting exposed food, clean equipment, utensils, linens, and unwrapped single-service items."
      },
      {
        section: "2-303.11",
        category: "Hands",
        question: "Which jewelry is generally allowed on food employees' hands and arms during food prep?",
        options: ["A plain ring such as a wedding band", "A watch with a cloth band", "Bracelets with charms", "Any jewelry under gloves"],
        answer: 0,
        explanation: "The Food Code generally limits hand and arm jewelry to a plain ring, because jewelry can trap soil and interfere with handwashing."
      },
      {
        section: "2-301.14",
        category: "Hands",
        question: "When must a food employee wash hands?",
        options: ["After handling raw animal food and before working with ready-to-eat food", "Only at the start of the shift", "Only when the manager asks", "Only after using gloves"],
        answer: 0,
        explanation: "Handwashing is required at key contamination points, including after handling raw animal food before working with ready-to-eat food."
      },
      {
        section: "5-205.11",
        category: "Hand Sinks",
        question: "A handwashing sink in a food prep area should be used for what purpose?",
        options: ["Handwashing only", "Dumping mop water", "Rinsing lettuce", "Storing sanitizer buckets"],
        answer: 0,
        explanation: "Handwashing sinks must be accessible and used for handwashing, not as utility, food prep, or storage sinks."
      },
      {
        section: "3-302.11",
        category: "Separation",
        question: "Which storage order best protects ready-to-eat food in a refrigerator?",
        options: ["Ready-to-eat foods above raw animal foods", "Raw chicken above salad", "Raw ground beef above cooked rice", "Raw shell eggs above uncovered desserts"],
        answer: 0,
        explanation: "Ready-to-eat foods should be protected from raw animal food drip and cross-contamination."
      },
      {
        section: "3-201.11",
        category: "Approved Source",
        question: "Which receiving finding is a basic approved-source concern?",
        options: ["Food arrives from an unapproved home kitchen", "A delivery arrives 10 minutes early", "Cases are labeled with a brand name", "The invoice is printed in black ink"],
        answer: 0,
        explanation: "Food must be obtained from approved sources that comply with applicable law."
      },
      {
        section: "3-202.11",
        category: "Receiving",
        question: "Which receiving condition should trigger concern for refrigerated TCS food?",
        options: ["It arrives above required cold-holding temperature", "It arrives with an invoice", "It arrives before lunch", "It arrives in a clean truck"],
        answer: 0,
        explanation: "Receiving is a control point; TCS foods must arrive at safe temperatures and in sound condition."
      },
      {
        section: "3-501.13",
        category: "Thawing",
        question: "Which is an approved way to thaw TCS food?",
        options: ["Under refrigeration that maintains safe food temperature", "On the counter overnight", "In standing warm water", "On top of the dishwasher"],
        answer: 0,
        explanation: "Approved thawing methods include refrigeration, as part of cooking, microwave followed by cooking, or under controlled running water."
      },
      {
        section: "3-403.11",
        category: "Reheating",
        question: "Commercially processed TCS food reheated for hot holding should generally reach what temperature?",
        options: ["135°F", "100°F", "120°F", "Only room temperature"],
        answer: 0,
        explanation: "Commercially processed ready-to-eat TCS food reheated for hot holding is generally reheated to 135°F."
      },
      {
        section: "3-403.11",
        category: "Reheating",
        question: "Leftover TCS food made in-house and reheated for hot holding should generally reach what temperature?",
        options: ["165°F for 15 seconds", "135°F for 1 second", "145°F for 4 minutes", "70°F within 2 hours"],
        answer: 0,
        explanation: "Food cooked, cooled, and reheated for hot holding is generally reheated to 165°F for 15 seconds."
      },
      {
        section: "3-501.15",
        category: "Cooling",
        question: "Which cooling method is generally appropriate for hot TCS food?",
        options: ["Using shallow pans or smaller portions", "Leaving a deep covered stockpot on the counter", "Putting hot food in a sealed five-gallon bucket", "Cooling only after the facility closes"],
        answer: 0,
        explanation: "Cooling methods should speed heat removal, such as shallow pans, smaller portions, ice baths, or rapid cooling equipment."
      },
      {
        section: "3-501.19",
        category: "Time Control",
        question: "When using time as a public health control, what must the facility generally have?",
        options: ["Written procedures and a way to mark or track time", "Only a verbal promise from staff", "No temperature records ever", "A customer-facing sign only"],
        answer: 0,
        explanation: "Time as a public health control requires written procedures and tracking so food is served or discarded within allowed time limits."
      },
      {
        section: "3-304.14",
        category: "Sanitizer",
        question: "Wet wiping cloths used with sanitizer should generally be stored how between uses?",
        options: ["In sanitizer solution at proper concentration", "Dry on the prep table", "In a pocket", "In the hand sink"],
        answer: 0,
        explanation: "Wet wiping cloths used for food-contact surfaces are stored in sanitizer solution between uses."
      },
      {
        section: "4-302.14",
        category: "Sanitizer",
        question: "Why does a facility need sanitizer test strips or a test kit?",
        options: ["To verify sanitizer concentration", "To check employee schedules", "To measure refrigerator noise", "To replace cleaning"],
        answer: 0,
        explanation: "A test kit or device is needed to accurately measure sanitizing solution concentration."
      },
      {
        section: "4-703.11",
        category: "Warewashing",
        question: "After washing and rinsing food-contact equipment, what final step is required before air drying?",
        options: ["Sanitizing", "Polishing with a used towel", "Storing wet", "Spraying with fragrance"],
        answer: 0,
        explanation: "Food-contact surfaces must be washed, rinsed, sanitized, and air dried."
      },
      {
        section: "4-204.112",
        category: "Equipment",
        question: "A hot water dish machine should have what available for the inspector/operator to verify sanitizing?",
        options: ["A way to measure the required final rinse temperature", "A scented detergent label only", "A customer comment card", "A freezer thermometer"],
        answer: 0,
        explanation: "Warewashing equipment needs monitoring tools so operators can verify sanitizing temperatures or chemical concentration."
      },
      {
        section: "4-204.112",
        category: "Thermometers",
        question: "A cold holding unit should have what to help verify food safety control?",
        options: ["An accurate temperature measuring device", "A decorative dial with no numbers", "A calendar on the door", "Only a light switch"],
        answer: 0,
        explanation: "Cold holding equipment needs accurate temperature measurement so the operator can verify it is maintaining safe temperatures."
      },
      {
        section: "3-304.12",
        category: "Utensils",
        question: "In-use utensils for TCS food may generally be stored how?",
        options: ["In the food with the handle above the food surface", "In sanitizer with the food end submerged", "On the floor next to the prep table", "In a handwashing sink"],
        answer: 0,
        explanation: "In-use utensil storage must protect food and food-contact surfaces from contamination."
      },
      {
        section: "3-502.12",
        category: "Special Processes",
        question: "Reduced oxygen packaging of TCS food usually raises what kind of inspection concern?",
        options: ["Specialized process controls or a variance/HACCP requirement", "No concern if the bag is clear", "Only menu font size", "Only customer seating capacity"],
        answer: 0,
        explanation: "Reduced oxygen packaging can create serious hazards and commonly requires strict controls, HACCP documentation, or a variance."
      },
      {
        section: "3-402.11",
        category: "Parasites",
        question: "Fish intended for raw or undercooked service generally requires attention to what control?",
        options: ["Parasite destruction/freezing documentation unless exempt", "Only garnish temperature", "Only plate color", "No supplier information"],
        answer: 0,
        explanation: "Fish served raw or undercooked often requires parasite destruction controls or supplier documentation unless an exemption applies."
      },
      {
        section: "2-501.11",
        category: "Cleanup",
        question: "A facility should have procedures for responding to what event?",
        options: ["Vomiting or diarrheal events", "A customer asking for extra napkins", "A menu price change", "A delivery truck parking nearby"],
        answer: 0,
        explanation: "The Food Code requires procedures for employees to follow when responding to vomiting or diarrheal events."
      },
      {
        section: "2-102.11",
        category: "Person in Charge",
        question: "What should the person in charge be able to demonstrate during an inspection?",
        options: ["Knowledge of foodborne disease prevention and Code duties", "Only where menus are printed", "Only how to decorate plates", "Only the Wi-Fi password"],
        answer: 0,
        explanation: "The person in charge must demonstrate knowledge and active managerial control over food safety practices."
      },
      {
        section: "8-103.11",
        category: "Variances",
        question: "Which operation commonly requires a variance or special approval?",
        options: ["Curing food or using additives to preserve food", "Washing whole apples", "Serving bottled soda", "Using a commercial refrigerator"],
        answer: 0,
        explanation: "Specialized processes such as curing, smoking for preservation, or certain reduced oxygen packaging may require a variance."
      }
    ],
    achievements: [
      { min: 11, title: "Food Code Champion", note: "You are dangerous with a thermometer and a code book." },
      { min: 9, title: "Risk Factor Ranger", note: "Strong command of the stuff that prevents bad days." },
      { min: 6, title: "Inspection Ready", note: "Solid field instincts. Worthy of the clipboard." },
      { min: 3, title: "Code Cadet", note: "You are warming up. Keep the sanitizer test strips close." },
      { min: 0, title: "Fresh Permittee", note: "Everybody starts somewhere. The Food Code is waiting." }
    ]
  },
  pools: {
    id: "pools",
    label: "Pool Inspections",
    shortLabel: "Pools",
    eyebrow: "Public Pool Inspection Challenge",
    description: "Choose the pool board for twelve CDC/MAHC-inspired questions on chemistry, contamination, safety equipment, hot tubs, and operator controls.",
    sourceNote: "Pool inspection note",
    bestKey: "nehaTriviaBestPools",
    questions: [
      {
        section: "CDC MAHC",
        category: "Code Basics",
        question: "What is the Model Aquatic Health Code designed to help jurisdictions prevent at public aquatic venues?",
        options: ["Injuries and illnesses", "Only noise complaints", "Only construction delays", "Private backyard pool costs"],
        answer: 0,
        explanation: "CDC describes the MAHC as guidance to prevent injury and illness at public pools, hot tubs, splash pads, and similar venues."
      },
      {
        section: "Inspection Toolkit",
        category: "Inspection Role",
        question: "During a public pool inspection, what is the inspector primarily assessing?",
        options: ["Whether operation and maintenance meet the applicable health code", "Whether the water looks nice from the lobby", "Whether the operator has enough social media posts", "Whether admission prices are reasonable"],
        answer: 0,
        explanation: "CDC's Pool Inspection Toolkit frames inspections around whether facility operation and maintenance meet the jurisdiction's public health code."
      },
      {
        section: "CDC Healthy Pools",
        category: "Disinfectant",
        question: "In CDC healthy pool guidance, what is the typical chlorine range operators are told to maintain?",
        options: ["1-4 ppm", "0 ppm", "10-20 ppm at all times", "Only enough to smell chlorine"],
        answer: 0,
        explanation: "CDC's public guidance lists a typical chlorine range of 1-4 ppm, while local code requirements may be more specific by venue type."
      },
      {
        section: "CDC Healthy Pools",
        category: "Disinfectant",
        question: "In CDC healthy pool guidance, what is the typical bromine range operators are told to maintain?",
        options: ["3-8 ppm", "0.5-1 ppm", "10-15 ppm", "Bromine is never measured"],
        answer: 0,
        explanation: "CDC's general healthy pool guidance lists 3-8 ppm as the typical bromine range."
      },
      {
        section: "CDC Healthy Pools",
        category: "pH",
        question: "Which pH range does CDC list in its healthy pool guidance?",
        options: ["7.0-7.8", "5.0-6.0", "8.5-9.5", "pH is not part of pool chemistry"],
        answer: 0,
        explanation: "CDC guidance lists pH 7.0-7.8 and explains that pH affects disinfectant performance, comfort, and equipment."
      },
      {
        section: "CDC Healthy Pools",
        category: "pH",
        question: "Why does pH matter during a pool inspection?",
        options: ["Improper pH can reduce disinfectant effectiveness and irritate skin or eyes", "It only changes the color of the pool tile", "It replaces the need for chlorine", "It only matters in natural lakes"],
        answer: 0,
        explanation: "CDC notes that pH that is too high or too low can make chlorine or bromine less effective, irritate swimmers, and damage equipment."
      },
      {
        section: "CDC Healthy Pools",
        category: "Crypto",
        question: "Which germ is especially chlorine-tolerant and can survive more than 7 days even in properly treated water?",
        options: ["Cryptosporidium", "Norovirus", "E. coli", "Listeria"],
        answer: 0,
        explanation: "CDC highlights Cryptosporidium as a chlorine-tolerant parasite and a leading cause of pool-related outbreaks."
      },
      {
        section: "CDC Contamination",
        category: "Incident Response",
        question: "A diarrheal incident in a public pool should be treated as high risk because it may involve which chlorine-tolerant pathogen?",
        options: ["Cryptosporidium", "Tetanus", "Botulism", "Hepatitis B only"],
        answer: 0,
        explanation: "CDC's contamination response materials connect diarrheal incidents with Crypto risk and hyperchlorination protocols."
      },
      {
        section: "CDC Healthy Pools",
        category: "Bather Hygiene",
        question: "CDC recommends swimmers shower for at least how long before entering the water?",
        options: ["1 minute", "5 seconds", "10 minutes", "Only after swimming"],
        answer: 0,
        explanation: "CDC recommends showering for at least 1 minute to remove dirt and other materials that use up disinfectant."
      },
      {
        section: "CDC Chemical Safety",
        category: "Chemicals",
        question: "Which chemical storage practice should an inspector expect to see?",
        options: ["Pool chemicals kept secure and handled according to label directions", "Open buckets stored next to food", "Different chemicals mixed together to save space", "Chemicals stored where children can reach them"],
        answer: 0,
        explanation: "CDC emphasizes reading product labels, using protective equipment, and keeping pool chemicals secure."
      },
      {
        section: "CDC Hot Tubs",
        category: "Hot Tubs",
        question: "Why do hot tubs deserve special attention during inspections?",
        options: ["Users can breathe contaminated mists or aerosols, not just swallow water", "Hot water kills every germ instantly", "Hot tubs never need disinfectant", "Only the filter color matters"],
        answer: 0,
        explanation: "CDC notes that hot tub users may get respiratory, skin, or gastrointestinal illness from swallowing, contacting, or breathing contaminated water aerosols."
      },
      {
        section: "CDC Drowning Prevention",
        category: "Safety",
        question: "Which finding is most aligned with an inspector's injury-prevention focus?",
        options: ["A self-closing, self-latching gate is not working", "A lounge chair is the wrong shade of blue", "The snack bar menu is too short", "The music is not aquatic themed"],
        answer: 0,
        explanation: "CDC drowning-prevention guidance emphasizes barriers, supervision, CPR readiness, and other controls that keep swimmers from entering unsafe situations."
      },
      {
        section: "MAHC Operations",
        category: "Closure",
        question: "Which finding is most likely to require immediate action or closure?",
        options: ["No measurable disinfectant residual", "A faded umbrella logo", "A towel folded unevenly", "A snack machine out of chips"],
        answer: 0,
        explanation: "No measurable disinfectant residual is a direct illness-prevention hazard because germs are not being controlled."
      },
      {
        section: "MAHC Operations",
        category: "Water Clarity",
        question: "Why is pool water clarity a critical inspection item?",
        options: ["Poor clarity can prevent staff from seeing a swimmer in distress or a body on the bottom", "It only affects how photos look", "It replaces the need for disinfectant", "It only matters in competition pools"],
        answer: 0,
        explanation: "Water clarity is both a safety and operations issue; poor visibility can hide drowning hazards and signal filtration or chemistry problems."
      },
      {
        section: "MAHC Operations",
        category: "Records",
        question: "What should pool operators generally document during routine operation?",
        options: ["Disinfectant, pH, maintenance, and incident checks", "Only the weather forecast", "Only how many towels were used", "Only social media comments"],
        answer: 0,
        explanation: "Operational records help show that chemistry and equipment are being monitored between inspections."
      },
      {
        section: "CDC Healthy Pools",
        category: "Testing",
        question: "CDC public guidance says disinfectant and pH should be checked at least how often during routine use?",
        options: ["At least twice per day, and more often during heavy use", "Only once per month", "Only before opening day", "Only after a complaint"],
        answer: 0,
        explanation: "CDC advises checking disinfectant and pH at least twice per day and more often when the pool is heavily used."
      },
      {
        section: "MAHC Operations",
        category: "Cyanuric Acid",
        question: "What is the main inspection concern with too much cyanuric acid in an outdoor pool?",
        options: ["It can reduce chlorine effectiveness against germs", "It makes bromine required", "It makes pH testing unnecessary", "It eliminates the need for filtration"],
        answer: 0,
        explanation: "Cyanuric acid can protect chlorine from sunlight, but excessive levels can slow chlorine's ability to inactivate pathogens."
      },
      {
        section: "MAHC Operations",
        category: "Combined Chlorine",
        question: "High combined chlorine is most often a sign of what problem?",
        options: ["Chlorine reacting with swimmer waste and contaminants", "Too much fresh air outdoors", "A missing pool vacuum hose", "Too much lifeguard training"],
        answer: 0,
        explanation: "Combined chlorine forms when disinfectant reacts with nitrogen-containing waste such as sweat, urine, and other contaminants."
      },
      {
        section: "CDC Healthy Pools",
        category: "Bather Hygiene",
        question: "Why should swimmers stay out of the water when they have diarrhea?",
        options: ["They can introduce germs that make other swimmers sick", "It protects the deck paint", "It keeps the water warmer", "It prevents sunscreen from washing off"],
        answer: 0,
        explanation: "CDC emphasizes keeping diarrhea out of recreational water because one incident can release large numbers of germs."
      },
      {
        section: "CDC Healthy Pools",
        category: "Bather Hygiene",
        question: "Where should diapers be changed at an aquatic facility?",
        options: ["Away from poolside in a proper changing area", "On the pool deck", "In shallow water", "On a food-service counter"],
        answer: 0,
        explanation: "CDC recommends changing diapers away from poolside to keep germs from getting into the water."
      },
      {
        section: "MAHC Safety",
        category: "Emergency Equipment",
        question: "Which item belongs in a public pool safety inspection?",
        options: ["Required lifesaving equipment is present and accessible", "Lobby plants are watered", "Pool furniture is color-coordinated", "Music volume is trendy"],
        answer: 0,
        explanation: "Inspectors commonly verify lifesaving equipment is available, accessible, and in usable condition."
      },
      {
        section: "MAHC Safety",
        category: "Emergency Response",
        question: "Why is an emergency phone or communication system important at a pool?",
        options: ["Staff need a reliable way to summon emergency help", "It replaces CPR training", "It measures chlorine", "It controls the pool heater"],
        answer: 0,
        explanation: "Emergency communication supports rapid response when injury, drowning, or other urgent events occur."
      },
      {
        section: "MAHC Safety",
        category: "Barriers",
        question: "What is the public health purpose of a self-closing, self-latching pool gate?",
        options: ["To reduce unsupervised access, especially by children", "To keep leaves off the deck", "To improve water chemistry", "To make entry lines shorter"],
        answer: 0,
        explanation: "Barriers and working gates help prevent unsupervised access and drowning risk."
      },
      {
        section: "MAHC Safety",
        category: "Entrapment",
        question: "Which drain-related issue is a serious safety concern?",
        options: ["Missing, broken, or noncompliant drain cover", "A drain cover that matches the tile", "A drain listed on a maintenance log", "A drain visible in clear water"],
        answer: 0,
        explanation: "Drain covers and suction outlet protections are critical to reducing entrapment hazards."
      },
      {
        section: "MAHC Operations",
        category: "Filtration",
        question: "A sudden abnormal filter pressure reading may suggest what?",
        options: ["A filtration or flow problem needing operator attention", "The pool is automatically safer", "The pH test is no longer needed", "The pool has too many deck chairs"],
        answer: 0,
        explanation: "Filter pressure and flow indicators can reveal filtration problems that affect water quality."
      },
      {
        section: "MAHC Operations",
        category: "Recirculation",
        question: "Why does recirculation matter for pool health?",
        options: ["It moves water through filtration and treatment systems", "It changes the pool's address", "It replaces operator checks", "It only affects decorative fountains"],
        answer: 0,
        explanation: "Recirculation helps water reach filters and treatment equipment so disinfectant and filtration can work throughout the venue."
      },
      {
        section: "MAHC Operations",
        category: "Chemical Feed",
        question: "What is a key concern with chemical feed equipment?",
        options: ["It should operate as designed and not feed chemicals unsafely", "It should be hidden from all staff", "It should be adjusted only by swimmers", "It should never be labeled"],
        answer: 0,
        explanation: "Chemical feeders must be maintained and operated to deliver disinfectant and pH control safely and consistently."
      },
      {
        section: "CDC Chemical Safety",
        category: "Chemicals",
        question: "What is unsafe when handling pool chemicals?",
        options: ["Mixing incompatible chemicals together", "Reading the product label", "Wearing goggles when directed", "Keeping chemicals secured"],
        answer: 0,
        explanation: "CDC chemical safety materials warn that mishandling or mixing incompatible pool chemicals can cause serious injury."
      },
      {
        section: "CDC Chemical Safety",
        category: "Chemicals",
        question: "Which storage setup is most concerning?",
        options: ["Acid and chlorine products stored so leaks or spills can mix", "Chemicals kept secure and dry", "Products stored in labeled containers", "Safety equipment available nearby"],
        answer: 0,
        explanation: "Chemical storage should prevent incompatible products from mixing and creating hazardous reactions."
      },
      {
        section: "CDC Hot Tubs",
        category: "Hot Tubs",
        question: "CDC recommends which group avoid hot tubs?",
        options: ["Children younger than 5 years old", "Adults who can swim", "People wearing sandals on deck", "People who showered first"],
        answer: 0,
        explanation: "CDC hot tub guidance says children less than 5 years old should not use hot tubs."
      },
      {
        section: "MAHC Hot Tubs",
        category: "Hot Tubs",
        question: "Which hot tub water temperature is a common maximum limit inspectors look for?",
        options: ["104°F", "120°F", "140°F", "No maximum is needed"],
        answer: 0,
        explanation: "Public spa and hot tub codes commonly use 104°F as a maximum to reduce overheating and injury risk."
      },
      {
        section: "CDC Hot Tubs",
        category: "Hot Tubs",
        question: "Why can poorly maintained hot tubs be associated with respiratory illness?",
        options: ["Users can breathe contaminated aerosols or mist", "Hot tubs do not create aerosols", "Warm water makes all germs harmless", "Respiratory illness only comes from food"],
        answer: 0,
        explanation: "CDC notes hot tub users can be exposed by breathing mist or aerosols from contaminated water."
      },
      {
        section: "CDC Contamination",
        category: "Incident Response",
        question: "What should happen first when a fecal incident is identified in pool water?",
        options: ["Clear swimmers from the affected water and start the response procedure", "Ignore it if the water is clear", "Add air freshener", "Let swimmers decide"],
        answer: 0,
        explanation: "Contamination response begins with removing bathers from affected water and following the appropriate disinfection procedure."
      },
      {
        section: "CDC Contamination",
        category: "Incident Response",
        question: "Why are diarrheal incidents handled more aggressively than formed-stool incidents?",
        options: ["Diarrhea has higher Crypto concern and can spread widely in water", "Diarrhea is easier to see", "Formed stool is always sterile", "No disinfectant is needed for diarrhea"],
        answer: 0,
        explanation: "CDC treats diarrheal incidents as high risk because they may involve Cryptosporidium and other germs that spread through recreational water."
      },
      {
        section: "MAHC Splash Pads",
        category: "Splash Pads",
        question: "Why are splash pads included in aquatic health guidance?",
        options: ["Their water can spread germs if treatment and operations fail", "They never recirculate water", "They are only decorative sidewalks", "They cannot be used by children"],
        answer: 0,
        explanation: "CDC and MAHC materials include splash pads because treated recreational water venues can spread illness when controls fail."
      },
      {
        section: "MAHC Safety",
        category: "Signage",
        question: "Which rule is most important to communicate to swimmers?",
        options: ["Do not swim when sick with diarrhea", "Only swim in matching towels", "No talking near the pool", "Use only blue goggles"],
        answer: 0,
        explanation: "Clear bather rules help prevent contamination, especially keeping diarrheal illness out of the water."
      }
    ],
    achievements: [
      { min: 11, title: "Aquatic Health Ace", note: "You are reading the pool like the water is talking back." },
      { min: 9, title: "Deck Walk Pro", note: "Strong inspection instincts from chemistry to contamination response." },
      { min: 6, title: "Pool Form Ready", note: "Solid command of the public pool basics most forms care about." },
      { min: 3, title: "Test Strip Trainee", note: "You have the clipboard. Now keep practicing the chemistry." },
      { min: 0, title: "New Lifeguard Energy", note: "A fresh start. The MAHC is waiting at the deep end." }
    ]
  }
};

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const venueMaps = {
  exhibit: {
    label: "Exhibit Hall",
    src: "assets/sheraton-exhibit-hall-map.png",
    alt: "Sheraton exhibit hall and mezzanine level map",
    caption: "Exhibit hall and mezzanine map from the uploaded Sheraton conference material."
  },
  complex: {
    label: "Complex Map",
    src: "assets/sheraton-meeting-overview.png",
    alt: "Sheraton meeting space overview map",
    caption: "Conference complex overview with lobby, ballroom, and exhibit/mezzanine levels."
  },
  lobby: {
    label: "Hotel Overview",
    src: "assets/sheraton-floor-overview.png",
    alt: "Sheraton Kansas City Hotel floor plan overview",
    caption: "Full floor-plan packet overview from the uploaded Sheraton conference material."
  }
};
const stopWords = new Set("a an and are as at be but by can for from give has have how i if in into is it me my of on or our should the their them there they this to what when where who why with you your about after all also any best do does need recommend tell".split(" "));
let knowledgeDocs = null;

if (new URLSearchParams(location.search).has("refreshApp")) {
  refreshInstalledApp();
}

loadData().then(([sessions, guide]) => {
  state.sessions = sessions;
  state.guide = guide;
  normalizeTriviaRound();
  pruneSaved();
  hydrateControls();
  renderAll();
  loadAppAlerts();
  startAlertRotation();
  startLocalSessionReminders();
  loadSessionPresentations().then(renderAll);
  loadCommunityPosts();
  runAi();
  if (state.drinkValidation.code) {
    setView("drink");
    loadDrinkStatus();
  }
}).catch((error) => {
  document.querySelector("#sessionList").innerHTML = `<div class="empty-state">The schedule data could not be loaded. Open this folder through a local web server or refresh the bundled app files.</div>`;
  console.error(error);
});

document.querySelectorAll(".nav-item[data-view], .more-menu-item[data-view], .brand-home[data-view], .mobile-demo-button[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    closeMoreMenu();
    setView(button.dataset.view);
  });
});

els.moreMenuButton?.addEventListener("click", () => {
  const expanded = els.moreMenuButton.getAttribute("aria-expanded") === "true";
  toggleMoreMenu(!expanded);
});

els.appAlerts.addEventListener("click", (event) => {
  const dismiss = event.target.closest("[data-alert-dismiss]");
  if (dismiss) {
    dismissAppAlert(dismiss.dataset.alertDismiss);
    return;
  }
  const action = event.target.closest("[data-alert-view]");
  if (action) setView(action.dataset.alertView);
});

els.leadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = els.leadForm.querySelector('button[type="submit"]');
  const lead = {
    name: els.leadName.value.trim(),
    agency: els.leadAgency.value.trim(),
    email: els.leadEmail.value.trim(),
    capturedAt: new Date().toISOString(),
    source: "NEHA AEC 2026 Guide",
    page: location.href,
    userAgent: navigator.userAgent
  };
  if (!lead.name || !lead.agency || !lead.email || !els.leadEmail.checkValidity()) {
    els.leadForm.reportValidity();
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = "Saving...";
  try {
    await submitLead(lead);
    state.lead = lead;
    localStorage.setItem("nehaLead", JSON.stringify(lead));
    localStorage.setItem("nehaLeadSubmittedAt", new Date().toISOString());
    queueScheduleSync();
    renderLeadGate();
  } catch (error) {
    if (els.leadNote) els.leadNote.textContent = "Could not save your pass yet. Please check your connection and try again.";
    console.error(error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enter Guide";
  }
});

els.search.addEventListener("input", (event) => {
  const value = event.target.value.trim();
  if (isAiSearchPrompt(value)) {
    state.aiQuery = value;
    state.query = "";
  } else {
    state.aiQuery = "";
    state.query = value.toLowerCase();
  }
  state.myMode = value ? "all" : state.myMode;
  renderMySchedule();
});

els.category.addEventListener("change", (event) => {
  state.category = event.target.value;
  state.myMode = "all";
  renderSchedule();
  renderMySchedule();
});

els.status.addEventListener("change", (event) => {
  state.status = event.target.value;
  state.myMode = "all";
  renderSchedule();
  renderMySchedule();
});

document.querySelector("#clearSaved").addEventListener("click", () => {
  state.saved = { watch: {}, attend: {} };
  persistSaved();
  renderAll();
});

els.emailSchedule.addEventListener("click", async () => {
  const sessions = getAttending().sort(sortSessions);
  if (!sessions.length) {
    els.emailSchedule.textContent = "No attending sessions";
    window.setTimeout(() => {
      els.emailSchedule.textContent = "Email my schedule";
    }, 1800);
    return;
  }
  els.emailSchedule.disabled = true;
  els.emailSchedule.textContent = "Sending...";
  try {
    await submitAppPayload({
      type: "emailSchedule",
      name: state.lead?.name || "",
      agency: state.lead?.agency || "",
      email: state.lead?.email || "",
      sessions: sessions.map(sessionEmailPayload),
      requestedAt: new Date().toISOString(),
      source: "NEHA AEC 2026 Guide",
      page: location.href
    });
    els.emailSchedule.textContent = "Request sent";
  } catch (error) {
    els.emailSchedule.textContent = "Could not send";
    console.error(error);
  } finally {
    window.setTimeout(() => {
      els.emailSchedule.disabled = false;
      els.emailSchedule.textContent = "Email my schedule";
    }, 1800);
  }
});

els.myModeTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-my-mode]");
  if (!button) return;
  state.myMode = button.dataset.myMode;
  renderMySchedule();
});

els.aiForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runAi();
});

els.placeFilter.addEventListener("change", (event) => {
  state.placeFilter = event.target.value;
  renderPlaces();
});

els.placeGrid.addEventListener("click", (event) => {
  const directions = event.target.closest("[data-place-directions]");
  const rideshare = event.target.closest("[data-place-rideshare]");
  if (directions) {
    openWalkingDirections(Number(directions.dataset.placeDirections), directions);
    return;
  }
  if (rideshare) {
    toggleRideshareOptions(Number(rideshare.dataset.placeRideshare));
  }
});

els.sessionToolClose.addEventListener("click", closeSessionTool);
els.sessionToolModal.addEventListener("click", (event) => {
  if (event.target === els.sessionToolModal) closeSessionTool();
});

els.sessionToolTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-session-tool-tab]");
  if (!button) return;
  state.sessionTool.tab = button.dataset.sessionToolTab;
  renderSessionTool();
  if (state.sessionTool.tab === "questions") loadSessionThread(state.sessionTool.sessionId);
});

els.sessionNotesSave.addEventListener("click", () => {
  const id = state.sessionTool.sessionId;
  if (!id) return;
  saveSessionNotes(id);
  els.sessionNotesStatus.textContent = "Saved on this phone.";
  window.setTimeout(() => {
    els.sessionNotesStatus.textContent = "";
  }, 1800);
  renderSessions(els.sessionList, filteredSessions());
  renderMySchedule();
});

els.sessionNotesEmailForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const session = sessionById(state.sessionTool.sessionId);
  if (!session) return;
  const notes = saveSessionNotes(session.id);
  const recipientEmail = els.sessionNotesEmail.value.trim();
  if (!notes) {
    els.sessionNotesEmailStatus.textContent = "Add notes before sending.";
    return;
  }
  if (!recipientEmail || !els.sessionNotesEmail.checkValidity()) {
    els.sessionNotesEmailForm.reportValidity();
    return;
  }
  els.sessionNotesEmailSend.disabled = true;
  els.sessionNotesEmailSend.textContent = "Sending...";
  els.sessionNotesEmailStatus.textContent = "";
  try {
    await submitAppPayload({
      type: "emailSessionNotes",
      name: state.lead?.name || "",
      agency: state.lead?.agency || "",
      email: state.lead?.email || "",
      recipientEmail,
      session: sessionEmailPayload(session),
      notes,
      requestedAt: new Date().toISOString(),
      source: "NEHA AEC 2026 Guide",
      page: location.href
    });
    els.sessionNotesEmailStatus.textContent = "Notes email requested.";
  } catch (error) {
    els.sessionNotesEmailStatus.textContent = "Could not send yet. Please try again.";
    console.error(error);
  } finally {
    els.sessionNotesEmailSend.disabled = false;
    els.sessionNotesEmailSend.textContent = "Email My Notes";
  }
});

els.sessionQuestionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const session = sessionById(state.sessionTool.sessionId);
  if (!session) return;
  const question = {
    type: "sessionQuestion",
    sessionId: session.id,
    sessionTitle: session.title,
    sessionTime: `${formatDate(session.date)} ${session.time}`,
    title: els.sessionQuestionTitle.value.trim(),
    message: els.sessionQuestionMessage.value.trim(),
    name: state.lead?.name || "",
    agency: state.lead?.agency || "",
    email: state.lead?.email || "",
    postedAt: new Date().toISOString(),
    source: "NEHA AEC 2026 Guide",
    page: location.href
  };
  if (!question.title || !question.message) {
    els.sessionQuestionForm.reportValidity();
    return;
  }
  const button = els.sessionQuestionForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Posting...";
  els.sessionQuestionStatus.textContent = "";
  try {
    await submitAppPayload(question);
    els.sessionQuestionTitle.value = "";
    els.sessionQuestionMessage.value = "";
    els.sessionQuestionStatus.textContent = "Question posted.";
    window.setTimeout(() => loadSessionThread(session.id), 900);
  } catch (error) {
    els.sessionQuestionStatus.textContent = "Could not post yet. Please try again.";
    console.error(error);
  } finally {
    button.disabled = false;
    button.textContent = "Post Question";
  }
});

els.sessionQuestionThreads.addEventListener("submit", async (event) => {
  const form = event.target.closest(".session-reply-form");
  if (!form) return;
  event.preventDefault();
  const session = sessionById(state.sessionTool.sessionId);
  const questionId = form.dataset.questionId || "";
  const textarea = form.querySelector("textarea");
  const message = textarea.value.trim();
  if (!session || !questionId || !message) {
    form.reportValidity();
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".session-reply-status");
  button.disabled = true;
  button.textContent = "Replying...";
  status.textContent = "";
  try {
    await submitAppPayload({
      type: "sessionQuestionReply",
      sessionId: session.id,
      questionId,
      message,
      name: state.lead?.name || "",
      agency: state.lead?.agency || "",
      email: state.lead?.email || "",
      postedAt: new Date().toISOString(),
      source: "NEHA AEC 2026 Guide",
      page: location.href
    });
    textarea.value = "";
    status.textContent = "Reply posted.";
    window.setTimeout(() => loadSessionThread(session.id), 900);
  } catch (error) {
    status.textContent = "Could not post reply yet.";
    console.error(error);
  } finally {
    button.disabled = false;
    button.textContent = "Reply";
  }
});

els.communityCategories.addEventListener("click", (event) => {
  const button = event.target.closest("[data-community-category]");
  if (!button) return;
  state.communityCategory = button.dataset.communityCategory;
  renderCommunity();
});

els.communityCategoryInput.addEventListener("change", () => {
  state.communityCategory = els.communityCategoryInput.value;
  renderCommunity();
  renderCommunityImageField();
});

els.communityImageFile.addEventListener("change", async () => {
  const file = els.communityImageFile.files?.[0];
  state.communityImage = null;
  renderCommunityImagePreview();
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    els.communityStatus.textContent = "Please choose an image file.";
    els.communityImageFile.value = "";
    return;
  }
  els.communityStatus.textContent = "Preparing photo...";
  try {
    state.communityImage = await compressCommunityImage(file);
    els.communityStatus.textContent = "";
    renderCommunityImagePreview();
  } catch (error) {
    console.error(error);
    els.communityStatus.textContent = "Could not prepare that photo. Please choose another image.";
    els.communityImageFile.value = "";
  }
});

els.communityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = els.communityForm.querySelector('button[type="submit"]');
  const post = {
    type: "communityPost",
    category: els.communityCategoryInput.value,
    title: els.communityTitle.value.trim(),
    message: els.communityMessage.value.trim(),
    imageData: state.communityImage?.dataUrl || "",
    imageName: state.communityImage?.name || "",
    imageMime: state.communityImage?.mimeType || "",
    shareEmail: els.communityShareEmail.checked ? "Yes" : "No",
    name: state.lead?.name || "",
    agency: state.lead?.agency || "",
    email: state.lead?.email || "",
    postedAt: new Date().toISOString(),
    source: "NEHA AEC 2026 Guide",
    page: location.href
  };
  if (!post.category || !post.title || !post.message) {
    els.communityForm.reportValidity();
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = "Posting...";
  els.communityStatus.textContent = post.imageData ? "Uploading photo and creating post..." : "";
  try {
    await submitAppPayload(post);
    els.communityStatus.textContent = "Posted. Refreshing Community Connect...";
    els.communityForm.reset();
    state.communityImage = null;
    renderCommunityImagePreview();
    els.communityCategoryInput.value = post.category;
    state.communityCategory = post.category;
    renderCommunityImageField();
    window.setTimeout(loadCommunityPosts, post.imageData ? 2800 : 1200);
  } catch (error) {
    els.communityStatus.textContent = "Could not post yet. Please check connection and try again.";
    console.error(error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Post to Community";
  }
});

els.communityPosts.addEventListener("submit", async (event) => {
  const form = event.target.closest(".community-reply-form");
  if (!form) return;
  event.preventDefault();
  const postId = form.dataset.postId || "";
  const textarea = form.querySelector("textarea");
  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".community-reply-status");
  const message = textarea.value.trim();
  if (!postId || !message) {
    form.reportValidity();
    return;
  }
  const reply = {
    type: "communityReply",
    postId,
    message,
    name: state.lead?.name || "",
    agency: state.lead?.agency || "",
    email: state.lead?.email || "",
    postedAt: new Date().toISOString(),
    source: "NEHA AEC 2026 Guide",
    page: location.href
  };
  submitButton.disabled = true;
  submitButton.textContent = "Replying...";
  status.textContent = "";
  try {
    await submitAppPayload(reply);
    textarea.value = "";
    status.textContent = "Reply posted.";
    window.setTimeout(loadCommunityPosts, 900);
  } catch (error) {
    status.textContent = "Could not post reply yet. Please try again.";
    console.error(error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Reply";
  }
});

els.demoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = els.demoForm.querySelector('button[type="submit"]');
  const demoState = els.demoState.value.trim();
  const demoNotes = els.demoNotes.value.trim();
  const request = {
    type: "demoRequest",
    name: els.demoName.value.trim(),
    agency: els.demoAgency.value.trim(),
    email: els.demoEmail.value.trim(),
    phone: els.demoPhone.value.trim(),
    state: demoState,
    notes: [demoNotes, demoState ? `State: ${demoState}` : ""].filter(Boolean).join("\n\n"),
    requestedAt: new Date().toISOString(),
    source: "NEHA AEC 2026 Guide",
    page: location.href
  };
  if (!request.name || !request.agency || !request.email || !els.demoEmail.checkValidity()) {
    els.demoForm.reportValidity();
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
  els.demoStatus.textContent = "";
  try {
    await submitAppPayload(request);
    els.demoStatus.textContent = "Demo request sent. Someone from HS GovTech will reach out.";
    els.demoForm.reset();
    prefillDemoForm();
  } catch (error) {
    els.demoStatus.textContent = "Could not send yet. Please check your connection and try again.";
    console.error(error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Request Demo";
  }
});

els.freeDrinkButton.addEventListener("click", async () => {
  if (state.drinkTicket || state.drinkValidation.code) return;
  await createDrinkTicket();
});

els.drinkValidator.addEventListener("click", async (event) => {
  const serveButton = event.target.closest("[data-drink-serve]");
  if (serveButton) await markDrinkServed();
});

els.triviaStage.addEventListener("click", (event) => {
  const answerButton = event.target.closest("[data-answer]");
  const hintButton = event.target.closest("[data-trivia-hint]");
  const nextButton = event.target.closest("[data-trivia-next]");
  const restartButton = event.target.closest("[data-trivia-restart]");
  const refreshLeaderboardButton = event.target.closest("[data-trivia-refresh]");

  if (answerButton && !state.trivia.answered) {
    answerTrivia(Number(answerButton.dataset.answer));
    return;
  }
  if (hintButton) {
    useTriviaHint();
    return;
  }
  if (nextButton) {
    nextTriviaQuestion();
    return;
  }
  if (refreshLeaderboardButton) {
    loadTriviaLeaderboard();
    return;
  }
  if (restartButton) restartTrivia();
});

els.triviaBoardPicker.addEventListener("click", (event) => {
  const boardButton = event.target.closest("[data-trivia-board]");
  if (boardButton) setTriviaBoard(boardButton.dataset.triviaBoard);
});

els.installAppButton.addEventListener("click", async () => {
  if (state.installPrompt) {
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    renderInstallButton();
    return;
  }
  openInstallHelp();
});

els.installHelpClose.addEventListener("click", closeInstallHelp);
els.installHelpModal.addEventListener("click", (event) => {
  if (event.target === els.installHelpModal) closeInstallHelp();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.installPrompt = event;
  renderInstallButton();
});

window.addEventListener("appinstalled", () => {
  state.installPrompt = null;
  els.installAppButton.textContent = "Saved";
  els.installAppButton.disabled = true;
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch((error) => console.warn("Service worker registration failed", error));
}

renderLeadGate();
renderInstallButton();
resetTriviaOrder();

async function loadData() {
  if (window.NEHA_DATA?.sessions?.length && window.NEHA_DATA?.guide) {
    return [window.NEHA_DATA.sessions, window.NEHA_DATA.guide];
  }
  const [sessions, guide] = await Promise.all([
    fetch("data/sessions.json").then((r) => {
      if (!r.ok) throw new Error(`Could not load sessions.json: ${r.status}`);
      return r.json();
    }),
    fetch("data/guide.json").then((r) => {
      if (!r.ok) throw new Error(`Could not load guide.json: ${r.status}`);
      return r.json();
    })
  ]);
  return [sessions, guide];
}

async function submitLead(lead) {
  return submitAppPayload({ type: "lead", ...lead });
}

async function submitAppPayload(payload) {
  const endpoint = window.NEHA_LEAD_ENDPOINT || "";
  if (!endpoint) {
    console.warn("App endpoint is not configured. Saving locally only.");
    return;
  }
  await fetch(endpoint, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload)
  });
}

function queueScheduleSync() {
  if (!state.lead?.email) return;
  window.clearTimeout(state.scheduleSyncTimer);
  state.scheduleSyncTimer = window.setTimeout(syncSavedSchedule, 900);
}

async function syncSavedSchedule() {
  if (!state.lead?.email) return;
  if (state.scheduleSyncInFlight) {
    state.scheduleSyncPending = true;
    return;
  }
  state.scheduleSyncInFlight = true;
  state.scheduleSyncPending = false;
  try {
    await submitAppPayload({
      type: "scheduleSync",
      name: state.lead.name || "",
      agency: state.lead.agency || "",
      email: state.lead.email || "",
      attending: getAttending().sort(sortSessions).map(sessionEmailPayload),
      watching: getWatching().sort(sortSessions).map(sessionEmailPayload),
      syncedAt: new Date().toISOString(),
      source: "NEHA AEC 2026 Guide",
      page: location.href
    });
  } catch (error) {
    console.warn("Schedule sync did not complete yet.", error);
  } finally {
    state.scheduleSyncInFlight = false;
    if (state.scheduleSyncPending) queueScheduleSync();
  }
}

function setView(view) {
  if (view === "schedule") view = "my";
  state.activeView = view;
  document.querySelectorAll(".nav-item[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  document.querySelectorAll(".more-menu-item[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  els.moreMenuButton?.classList.toggle("active", false);
  document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}View`));
  els.title.textContent = viewTitles[view];
  els.searchWrap.style.display = view === "my" ? "grid" : "none";
  if (view === "my") renderMySchedule();
  if (view === "podcast") renderPodcast();
  if (view === "community") renderCommunity();
  if (view === "demo") prefillDemoForm();
  if (view === "trivia") renderTrivia();
  if (view === "drink") renderFreeDrink();
  renderAppAlerts();
}

function toggleMoreMenu(open) {
  if (!els.moreMenu || !els.moreMenuButton) return;
  els.moreMenu.hidden = !open;
  els.moreMenuButton.setAttribute("aria-expanded", String(open));
}

function closeMoreMenu() {
  toggleMoreMenu(false);
}

function prefillDemoForm() {
  if (!els.demoName.value) els.demoName.value = state.lead?.name || "";
  if (!els.demoAgency.value) els.demoAgency.value = state.lead?.agency || "";
  if (!els.demoEmail.value) els.demoEmail.value = state.lead?.email || "";
}

function hydrateControls() {
  const days = ["all", ...new Set(state.sessions.map((session) => session.date))];
  els.dayTabs.innerHTML = days.map((day) => `<button type="button" class="${day === "all" ? "active" : ""}" data-day="${day}">${dayLabel(day)}</button>`).join("");
  els.dayTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.day = button.dataset.day;
      els.dayTabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === button));
      state.myMode = "all";
      renderSchedule();
      renderMySchedule();
    });
  });

  const categories = [...new Set(state.sessions.map((session) => session.category))].sort();
  els.category.innerHTML += categories.map((category) => `<option value="${escapeAttr(category)}">${category}</option>`).join("");

  const placeCategories = [...new Set(state.guide.nearby.map((place) => place.category))].sort();
  els.placeFilter.innerHTML += placeCategories.map((category) => `<option value="${escapeAttr(category)}">${category}</option>`).join("");

  els.communityCategories.innerHTML = communityCategories.map((category) => `<button type="button" class="${category.id === state.communityCategory ? "active" : ""}" data-community-category="${category.id}">${category.label}</button>`).join("");
  els.communityCategoryInput.innerHTML = communityCategories
    .filter((category) => category.id !== "all")
    .map((category) => `<option value="${category.id}">${category.label}</option>`)
    .join("");
  renderCommunityImageField();

  els.venueMapTabs.innerHTML = Object.entries(venueMaps).map(([key, map]) => `<button type="button" class="${key === state.venueMap ? "active" : ""}" data-map="${key}">${map.label}</button>`).join("");
  els.venueMapTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.venueMap = button.dataset.map;
      renderVenue();
    });
  });
}

function renderAll() {
  renderSchedule();
  renderMySchedule();
  renderPlaces();
  renderVenue();
  renderPodcast();
  renderCommunity();
  renderAppAlerts();
  renderFreeDrink();
  renderLeadGate();
  updateSavedCounts();
}

function renderAppAlerts() {
  if (["podcast", "demo"].includes(state.activeView)) {
    els.appAlerts.innerHTML = "";
    return;
  }
  if (Date.now() < state.alertSnoozeUntil) {
    els.appAlerts.innerHTML = "";
    return;
  }
  const reminders = state.reminderAlert ? [state.reminderAlert] : [];
  const alerts = state.alerts.length ? state.alerts : fallbackAppAlerts;
  const rotating = alerts.length ? [alerts[state.alertIndex % alerts.length]] : [];
  const visibleAlerts = [...reminders, ...rotating]
    .map((alert) => ({ ...alert, id: appAlertId(alert) }));
  els.appAlerts.innerHTML = visibleAlerts.map((alert) => `
    <article class="app-alert" data-alert-id="${escapeAttr(alert.id)}">
      <span>${escapeHtml(brandCopy(alert.label))}</span>
      <div>
        <strong>${escapeHtml(brandCopy(alert.title))}</strong>
        <p>${escapeHtml(brandCopy(alert.message))}</p>
      </div>
      <button type="button" data-alert-view="${escapeAttr(alert.view)}">${escapeHtml(brandCopy(alert.action))}</button>
      <button class="alert-dismiss" type="button" data-alert-dismiss="${escapeAttr(alert.id)}" aria-label="Close alert">&times;</button>
    </article>
  `).join("");
}

function appAlertId(alert) {
  return [alert.label, alert.title, alert.message, alert.action, alert.view]
    .map((part) => String(part || "").trim().toLowerCase())
    .join("|");
}

function dismissAppAlert(alertId) {
  if (!alertId) return;
  state.alertSnoozeUntil = Date.now() + APP_ALERT_SNOOZE_MS;
  localStorage.setItem("nehaAlertSnoozeUntil", String(state.alertSnoozeUntil));
  if (state.reminderAlert && appAlertId(state.reminderAlert) === alertId) state.reminderAlert = null;
  renderAppAlerts();
}

function startAlertRotation() {
  window.setInterval(() => {
    const alerts = state.alerts.length ? state.alerts : fallbackAppAlerts;
    if (alerts.length < 2) return;
    state.alertIndex = (state.alertIndex + 1) % alerts.length;
    localStorage.setItem("nehaAlertIndex", String(state.alertIndex));
    renderAppAlerts();
  }, 12000);
}

function startLocalSessionReminders() {
  checkLocalSessionReminders();
  window.setInterval(checkLocalSessionReminders, 60000);
}

function checkLocalSessionReminders() {
  const candidates = [...getAttending(), ...getWatching()]
    .filter((session, index, list) => list.findIndex((item) => item.id === session.id) === index)
    .sort(sortSessions);
  const now = Date.now();
  const upcoming = candidates.find((session) => {
    const minutes = (sessionStartDate(session).getTime() - now) / 60000;
    return minutes >= 0 && minutes <= 10 && !state.reminders[session.id];
  });
  if (upcoming) {
    state.reminders[upcoming.id] = new Date().toISOString();
    localStorage.setItem("nehaSessionReminders", JSON.stringify(state.reminders));
    state.reminderAlert = {
      label: "Next Up",
      title: "Session starting soon",
      message: `${upcoming.title} starts at ${shortTime(upcoming.start)} in ${upcoming.location}.`,
      action: "Open MyNEHA",
      view: "my"
    };
  } else if (state.reminderAlert) {
    const activeReminder = candidates.find((session) => state.reminderAlert.message.includes(session.title) && sessionEndDate(session).getTime() >= now);
    if (!activeReminder) state.reminderAlert = null;
  }
  renderAppAlerts();
}

function loadAppAlerts() {
  const endpoint = window.NEHA_LEAD_ENDPOINT || "";
  if (!endpoint) return Promise.resolve();
  return new Promise((resolve) => {
    const callbackName = `nehaAlerts${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 8000);
    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }
    window[callbackName] = (data) => {
      cleanup();
      const alerts = Array.isArray(data?.alerts) ? data.alerts.filter(isUsableAlert) : [];
      if (alerts.length) {
        state.alerts = alerts;
        renderAppAlerts();
      }
      resolve();
    };
    script.src = `${endpoint}?action=alerts&callback=${callbackName}&t=${Date.now()}`;
    script.onerror = () => {
      cleanup();
      resolve();
    };
    document.body.appendChild(script);
  });
}

function isUsableAlert(alert) {
  return Boolean(alert?.label && alert?.title && alert?.message && alert?.action && alert?.view && viewTitles[alert.view]);
}

function renderLeadGate() {
  const hasLead = Boolean(state.lead?.name && state.lead?.agency && state.lead?.email);
  els.leadGate.hidden = hasLead;
  document.body.classList.toggle("lead-locked", !hasLead);
}

function renderFreeDrink() {
  if (state.drinkValidation.code) {
    renderDrinkValidator();
    return;
  }

  els.freeDrinkButton.hidden = false;
  els.drinkValidator.hidden = true;
  if (state.drinkTicket) {
    els.freeDrinkButton.disabled = true;
    els.freeDrinkButton.textContent = "QR READY";
    els.drinkQr.hidden = false;
    els.drinkQr.innerHTML = drinkQrHtml(state.drinkTicket);
    els.freeDrinkStatus.textContent = "Present this QR code at the HS GovTech booth. One ticket per phone/browser.";
  } else {
    els.freeDrinkButton.disabled = false;
    els.freeDrinkButton.textContent = "FREE DRINK";
    els.drinkQr.hidden = true;
    els.drinkQr.innerHTML = "";
    els.freeDrinkStatus.textContent = "One redemption per phone/browser.";
  }
}

function renderDrinkValidator() {
  els.freeDrinkButton.hidden = true;
  els.drinkQr.hidden = true;
  els.drinkQr.innerHTML = "";
  els.drinkValidator.hidden = false;
  els.freeDrinkStatus.textContent = "Booth validation mode";

  if (state.drinkValidation.loading) {
    els.drinkValidator.innerHTML = `<div class="validator-card"><strong>Checking ticket...</strong><p>${escapeHtml(state.drinkValidation.code)}</p></div>`;
    return;
  }

  if (state.drinkValidation.error) {
    els.drinkValidator.innerHTML = `<div class="validator-card invalid"><strong>Could not validate</strong><p>${escapeHtml(state.drinkValidation.error)}</p></div>`;
    return;
  }

  const ticket = state.drinkValidation.ticket;
  if (!ticket) {
    els.drinkValidator.innerHTML = `<div class="validator-card"><strong>Ready to validate</strong><p>${escapeHtml(state.drinkValidation.code)}</p></div>`;
    return;
  }

  if (!ticket.found) {
    els.drinkValidator.innerHTML = `<div class="validator-card invalid"><strong>Invalid drink ticket</strong><p>This code was not found in the redemption sheet.</p><code>${escapeHtml(state.drinkValidation.code)}</code></div>`;
    return;
  }

  const served = ticket.status === "Served";
  els.drinkValidator.innerHTML = `
    <div class="validator-card ${served ? "served" : "valid"}">
      <strong>${served ? "Already served" : "Valid free drink"}</strong>
      <p>${escapeHtml(ticket.name || "Unknown attendee")}</p>
      <small>${escapeHtml(ticket.agency || "")}</small>
      <code>${escapeHtml(ticket.code)}</code>
      ${served ? `<p>Served ${escapeHtml(ticket.servedAt || "")}</p>` : `<button type="button" data-drink-serve>Mark served</button>`}
    </div>
  `;
}

function renderInstallButton() {
  if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) {
    els.installAppButton.textContent = "Saved";
    els.installAppButton.disabled = true;
    return;
  }
  els.installAppButton.textContent = "Install App";
  els.installAppButton.disabled = false;
}

async function refreshInstalledApp() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn("App refresh cleanup failed", error);
  } finally {
    const cleanUrl = `${location.origin}${location.pathname}`;
    window.setTimeout(() => location.replace(cleanUrl), 250);
  }
}

async function createDrinkTicket() {
  const ticket = {
    code: createDrinkCode(),
    name: state.lead?.name || "",
    agency: state.lead?.agency || "",
    email: state.lead?.email || "",
    issuedAt: new Date().toISOString()
  };
  els.freeDrinkButton.disabled = true;
  els.freeDrinkButton.textContent = "CREATING QR...";
  els.freeDrinkStatus.textContent = "Creating your booth QR...";
  try {
    await submitAppPayload({
      type: "drinkRedemption",
      ...ticket,
      source: "NEHA AEC 2026 Guide",
      page: location.href,
      userAgent: navigator.userAgent
    });
    state.drinkTicket = ticket;
    localStorage.setItem("nehaDrinkTicket", JSON.stringify(ticket));
    localStorage.setItem("nehaFreeDrinkRedeemed", "true");
  } catch (error) {
    els.freeDrinkStatus.textContent = "Could not create the QR yet. Please check connection and try again.";
    console.error(error);
  } finally {
    renderFreeDrink();
  }
}

function createDrinkCode() {
  if (crypto.randomUUID) return `NEHA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return `NEHA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function drinkQrHtml(ticket) {
  const validationUrl = `${location.origin}${location.pathname}?drinkCode=${encodeURIComponent(ticket.code)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(validationUrl)}`;
  return `
    <div class="qr-frame">
      <img src="${escapeAttr(qrUrl)}" alt="Free drink redemption QR code">
    </div>
    <div class="ticket-details">
      <strong>${escapeHtml(ticket.code)}</strong>
      <span>${escapeHtml(ticket.name || "NEHA attendee")}</span>
      <small>Scan at the HS GovTech booth to validate.</small>
    </div>
  `;
}

function loadDrinkStatus() {
  const endpoint = window.NEHA_LEAD_ENDPOINT || "";
  if (!endpoint || !state.drinkValidation.code) return Promise.resolve();
  state.drinkValidation.loading = true;
  state.drinkValidation.error = "";
  renderFreeDrink();
  return loadJsonp(endpoint, { action: "drinkStatus", code: state.drinkValidation.code })
    .then((data) => {
      state.drinkValidation.ticket = data?.ticket || { found: false };
    })
    .catch((error) => {
      state.drinkValidation.error = "The redemption sheet could not be reached.";
      console.error(error);
    })
    .finally(() => {
      state.drinkValidation.loading = false;
      renderFreeDrink();
    });
}

async function markDrinkServed() {
  if (!state.drinkValidation.code) return;
  state.drinkValidation.loading = true;
  renderFreeDrink();
  try {
    await submitAppPayload({
      type: "drinkServed",
      code: state.drinkValidation.code,
      servedAt: new Date().toISOString(),
      page: location.href
    });
    window.setTimeout(loadDrinkStatus, 900);
  } catch (error) {
    state.drinkValidation.loading = false;
    state.drinkValidation.error = "Could not mark served yet.";
    renderFreeDrink();
    console.error(error);
  }
}

function loadJsonp(endpoint, params) {
  return new Promise((resolve, reject) => {
    const callbackName = `nehaJsonp${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Timed out"));
    }, 8000);
    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }
    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };
    const query = new URLSearchParams({ ...params, callback: callbackName, t: Date.now() });
    script.src = `${endpoint}?${query.toString()}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("Could not load JSONP"));
    };
    document.body.appendChild(script);
  });
}

function renderSchedule() {
  const sessions = filteredSessions();
  renderNowNext();
  els.metrics.innerHTML = metricHtml([
    [sessions.length, "sessions shown"],
    [sumCe(sessions), "CE credits visible"],
    [new Set(sessions.map((s) => s.location)).size, "rooms in view"],
    [conflictCount(getAttending()), "attending conflicts"]
  ]);
  renderSessions(els.sessionList, sessions);
}

function renderNowNext() {
  const source = currentAndNextSessions();
  els.nowNext.innerHTML = source.map(({ session, label }) => `
    <article>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(session.title)}</strong>
      <small>${formatDate(session.date)} - ${session.time} - ${escapeHtml(session.location)}</small>
    </article>
  `).join("");
}

function currentAndNextSessions() {
  const sessions = state.sessions
    .filter((session) => session.category !== "Registration")
    .sort(sortSessions);
  const now = new Date();
  const upcoming = sessions.filter((session) => sessionEndDate(session) >= now);
  const active = upcoming.find((session) => sessionStartDate(session) <= now && sessionEndDate(session) >= now);
  if (active) {
    const next = upcoming.find((session) => session.id !== active.id && sessionStartDate(session) >= now);
    return [
      { session: active, label: "Happening Now" },
      ...(next ? [{ session: next, label: "Next Up" }] : [])
    ];
  }
  if (upcoming.length) {
    return upcoming.slice(0, 2).map((session, index) => ({ session, label: index === 0 ? "Start Here" : "Next Up" }));
  }
  return sessions.slice(-2).map((session, index) => ({ session, label: index === 0 ? "Recently Ended" : "Last Up" }));
}

function filteredSessions() {
  return state.sessions
    .filter((session) => state.day === "all" || session.date === state.day)
    .filter((session) => state.category === "all" || session.category === state.category)
    .filter((session) => {
      if (state.status === "attending") return Boolean(state.saved.attend[session.id]);
      if (state.status === "watching") return Boolean(state.saved.watch[session.id]);
      if (state.status === "ce") return Number(session.ce) > 0;
      return true;
    })
    .filter((session) => matchesQuery(session, state.query))
    .sort(sortSessions);
}

function renderSessions(container, sessions, options = {}) {
  if (!sessions.length) {
    container.innerHTML = `<div class="empty-state">${options.empty || "No sessions match this view yet."}</div>`;
    return;
  }
  const template = document.querySelector("#sessionTemplate");
  container.innerHTML = "";
  sessions.forEach((session) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-field="start"]').textContent = shortTime(session.start);
    node.querySelector('[data-field="end"]').textContent = shortTime(session.end);
    node.querySelector('[data-field="meta"]').textContent = `${formatDate(session.date)} - ${session.location} - ${session.category}`;
    node.querySelector('[data-field="title"]').textContent = session.title;
    node.querySelector('[data-field="ce"]').textContent = session.ce ? `${session.ceDisplay} CE` : "CE N/A";
    node.querySelector('[data-field="info"]').textContent = session.info;
    node.querySelector('[data-field="tags"]').innerHTML = session.tags.slice(0, 6).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
    const watch = node.querySelector(".watch-btn");
    const attend = node.querySelector(".attend-btn");
    const presentation = node.querySelector(".presentation-btn");
    const notes = node.querySelector(".notes-btn");
    const question = node.querySelector(".question-btn");
    watch.classList.toggle("active", Boolean(state.saved.watch[session.id]));
    attend.classList.toggle("active", Boolean(state.saved.attend[session.id]));
    watch.textContent = state.saved.watch[session.id] ? "Watching" : "Watch";
    attend.textContent = state.saved.attend[session.id] ? "Attending" : "Attend";
    presentation.classList.toggle("has-materials", Boolean(state.presentations[session.id]?.length));
    notes.classList.toggle("has-notes", Boolean(state.sessionNotes[session.id]));
    presentation.textContent = state.presentations[session.id]?.length ? "Presentations" : "Presentations";
    notes.textContent = state.sessionNotes[session.id] ? "Notes saved" : "Session notes";
    watch.addEventListener("click", () => toggleSaved("watch", session.id));
    attend.addEventListener("click", () => toggleSaved("attend", session.id));
    presentation.addEventListener("click", () => openSessionTool(session.id, "presentations"));
    notes.addEventListener("click", () => openSessionTool(session.id, "notes"));
    question.addEventListener("click", () => openSessionTool(session.id, "questions"));
    container.appendChild(node);
  });
}

function renderMySchedule() {
  const attending = getAttending();
  const watching = getWatching().filter((session) => !state.saved.attend[session.id]);
  const combined = [...attending, ...watching].sort(sortSessions);
  const days = [...new Set(state.sessions.map((session) => session.date))];
  if (!state.myDay) state.myDay = days[0];
  if (combined.length && !combined.some((session) => session.date === state.myDay)) {
    state.myDay = combined[0].date;
  }
  renderMyModeTabs(attending, watching);
  els.mySavedPanel.hidden = state.myMode !== "day";
  els.myBrowsePanel.hidden = state.myMode !== "all";
  renderMyDayTabs(days, combined);
  renderDailyGrid(combined);
  renderConflictBanner();
  els.mySummary.innerHTML = metricHtml([
    [attending.length, "marked attending"],
    [watching.length, "watch-list only"],
    [sumCe(attending), "planned CE credits"],
    [conflictCount(attending), "time conflicts"]
  ]);
  renderSchedule();
  renderMyAiPanel();
}

function renderMyModeTabs(attending, watching) {
  els.myModeTabs.querySelectorAll("[data-my-mode]").forEach((button) => {
    const mode = button.dataset.myMode;
    button.classList.toggle("active", mode === state.myMode);
    if (mode === "day") button.textContent = `My Day (${attending.length + watching.length})`;
    if (mode === "all") button.textContent = "All Sessions";
  });
}

function openSessionTool(sessionId, tab = "notes") {
  state.sessionTool.sessionId = sessionId;
  state.sessionTool.tab = tab;
  els.sessionToolModal.hidden = false;
  document.body.classList.add("modal-open");
  renderSessionTool();
  if (tab === "questions") loadSessionThread(sessionId);
}

function closeSessionTool() {
  els.sessionToolModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function openInstallHelp() {
  const ua = navigator.userAgent || "";
  const isApple = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const steps = isApple
    ? [
        ["1", "Tap the Share icon in Safari."],
        ["2", "Choose Add to Home Screen."],
        ["3", "Tap Add. The guide will open like an app."]
      ]
    : isAndroid
      ? [
          ["1", "Open the browser menu."],
          ["2", "Choose Install app or Add to Home screen."],
          ["3", "Tap Install. The guide will open like an app."]
        ]
      : [
          ["1", "Open your browser menu."],
          ["2", "Choose Install app, Add to Home screen, or Create shortcut."],
          ["3", "Pin it for fast conference access."]
        ];
  els.installHelpSteps.innerHTML = steps.map(([number, text]) => `
    <article>
      <span>${number}</span>
      <p>${escapeHtml(text)}</p>
    </article>
  `).join("");
  els.installHelpModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeInstallHelp() {
  els.installHelpModal.hidden = true;
  if (els.sessionToolModal.hidden) document.body.classList.remove("modal-open");
}

function renderSessionTool() {
  const session = sessionById(state.sessionTool.sessionId);
  if (!session) return;
  els.sessionToolTitle.textContent = session.title;
  els.sessionToolMeta.textContent = `${formatDate(session.date)} - ${session.time} - ${session.location}`;
  els.sessionToolTabs.querySelectorAll("[data-session-tool-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.sessionToolTab === state.sessionTool.tab);
  });
  els.sessionPresentationPanel.hidden = state.sessionTool.tab !== "presentations";
  els.sessionNotesPanel.hidden = state.sessionTool.tab !== "notes";
  els.sessionQuestionsPanel.hidden = state.sessionTool.tab !== "questions";
  renderSessionPresentations(session.id);
  renderSessionNotes(session.id);
  renderSessionQuestions(session.id);
}

function renderSessionPresentations(sessionId) {
  const links = state.presentations[sessionId] || [];
  if (!links.length) {
    els.sessionPresentationPanel.innerHTML = `<div class="empty-state">No presentation files are posted for this session yet. This area is ready for post-conference materials.</div>`;
    return;
  }
  els.sessionPresentationPanel.innerHTML = `
    <div class="presentation-list">
      ${links.map((item) => `
        <a href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">
          <strong>${escapeHtml(item.title || "Session presentation")}</strong>
          <span>${escapeHtml(item.speaker || "Presentation file")}</span>
        </a>
      `).join("")}
    </div>
  `;
}

function renderSessionNotes(sessionId) {
  if (document.activeElement !== els.sessionNotesInput) {
    els.sessionNotesInput.value = state.sessionNotes[sessionId] || "";
  }
  if (!els.sessionNotesEmail.value) els.sessionNotesEmail.value = state.lead?.email || "";
}

function saveSessionNotes(sessionId) {
  const notes = els.sessionNotesInput.value.trim();
  if (notes) {
    state.sessionNotes[sessionId] = notes;
  } else {
    delete state.sessionNotes[sessionId];
  }
  localStorage.setItem("nehaSessionNotes", JSON.stringify(state.sessionNotes));
  return notes;
}

function renderSessionQuestions(sessionId) {
  const thread = state.sessionThreads[sessionId];
  if (state.sessionTool.loading && !thread) {
    els.sessionQuestionThreads.innerHTML = `<div class="empty-state">Loading session Q&A...</div>`;
    return;
  }
  if (!thread?.questions?.length) {
    els.sessionQuestionThreads.innerHTML = `<div class="empty-state">No questions yet. Start a session-specific thread.</div>`;
    return;
  }
  els.sessionQuestionThreads.innerHTML = thread.questions.map((question) => `
    <article class="session-question-card">
      <div class="community-post-head">
        <span>Session Q&A</span>
        <small>${escapeHtml(relativePostTime(question.postedAt))}</small>
      </div>
      <h3>${escapeHtml(question.title)}</h3>
      <p>${escapeHtml(question.message)}</p>
      <div class="community-byline">
        <strong>${escapeHtml(question.displayName || "NEHA attendee")}</strong>
        <span>${escapeHtml(question.agency || "Environmental health community")}</span>
      </div>
      <div class="community-replies">
        ${question.replies?.length ? question.replies.map((reply) => `
          <div class="community-reply">
            <p>${escapeHtml(reply.message || "")}</p>
            <div>
              <strong>${escapeHtml(reply.displayName || "NEHA attendee")}</strong>
              <span>${escapeHtml(reply.agency || "Environmental health community")}</span>
              <small>${escapeHtml(relativePostTime(reply.postedAt))}</small>
            </div>
          </div>
        `).join("") : `<div class="community-reply-empty">No replies yet.</div>`}
      </div>
      <form class="session-reply-form" data-question-id="${escapeAttr(question.id)}">
        <label>
          Reply
          <textarea rows="2" maxlength="500" placeholder="Add a helpful reply..." required></textarea>
        </label>
        <button type="submit">Reply</button>
        <span class="session-reply-status"></span>
      </form>
    </article>
  `).join("");
}

function loadSessionThread(sessionId) {
  const endpoint = window.NEHA_LEAD_ENDPOINT || "";
  if (!endpoint || !sessionId) {
    renderSessionQuestions(sessionId);
    return Promise.resolve();
  }
  state.sessionTool.loading = true;
  renderSessionQuestions(sessionId);
  return loadJsonp(endpoint, { action: "sessionThread", sessionId })
    .then((data) => {
      state.sessionThreads[sessionId] = data?.thread || { sessionId, questions: [] };
    })
    .catch((error) => {
      console.warn("Session thread could not load", error);
    })
    .finally(() => {
      state.sessionTool.loading = false;
      renderSessionQuestions(sessionId);
    });
}

function loadSessionPresentations() {
  const endpoint = window.NEHA_LEAD_ENDPOINT || "";
  if (!endpoint) return Promise.resolve();
  return loadJsonp(endpoint, { action: "sessionPresentations" })
    .then((data) => {
      state.presentations = data?.presentations || {};
    })
    .catch((error) => {
      console.warn("Session presentations could not load", error);
    });
}

function renderMyDayTabs(days, savedSessions) {
  els.myDayTabs.innerHTML = days.map((day) => {
    const count = savedSessions.filter((session) => session.date === day).length;
    const label = `${dayLabel(day)} ${count ? `(${count})` : ""}`;
    return `<button type="button" class="${day === state.myDay ? "active" : ""}" data-day="${day}">${label}</button>`;
  }).join("");
  els.myDayTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.myDay = button.dataset.day;
      renderMySchedule();
    });
  });
}

function renderDailyGrid(savedSessions) {
  const dayItems = savedSessions.filter((session) => session.date === state.myDay).sort(sortSessions);
  if (!dayItems.length) {
    els.myDailyGrid.innerHTML = `
      <div class="empty-state">
        No saved sessions for ${dayLabel(state.myDay)} yet.
        <button type="button" class="inline-empty-action" data-open-all-sessions>Browse all sessions</button>
      </div>
    `;
    return;
  }
  els.myDailyGrid.innerHTML = dayItems.map((session) => {
    const kind = state.saved.attend[session.id] ? "Attending" : "Watching";
    const conflictClass = findConflicts(session).length ? " has-conflict" : "";
    return `
      <article class="day-block${conflictClass}">
        <div class="day-time">${shortTime(session.start)} - ${shortTime(session.end)}</div>
        <div>
          <strong>${escapeHtml(session.title)}</strong>
          <span>${escapeHtml(session.location)} - ${escapeHtml(kind)}</span>
          <div class="day-session-tools">
            <button type="button" data-session-tool="${escapeAttr(session.id)}" data-tool-tab="presentations" aria-label="View presentations for ${escapeAttr(session.title)}">PPT</button>
            <button type="button" class="${state.sessionNotes[session.id] ? "has-notes" : ""}" data-session-tool="${escapeAttr(session.id)}" data-tool-tab="notes" aria-label="Open notes for ${escapeAttr(session.title)}">Notes</button>
            <button type="button" data-session-tool="${escapeAttr(session.id)}" data-tool-tab="questions" aria-label="Ask a question about ${escapeAttr(session.title)}">Ask</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

els.myDailyGrid.addEventListener("click", (event) => {
  const sessionTool = event.target.closest("[data-session-tool]");
  if (sessionTool) {
    openSessionTool(sessionTool.dataset.sessionTool, sessionTool.dataset.toolTab || "notes");
    return;
  }
  if (event.target.closest("[data-open-all-sessions]")) {
    state.myMode = "all";
    renderMySchedule();
  }
});

function runAi() {
  const prompt = els.aiPrompt.value.trim();
  const response = getAiResponse(prompt);
  renderAiAnswer(response.answer, els.aiAnswer);
  renderAiReasons(response.profile, els.aiReasons);
  if (response.shouldRecommendSessions) {
    renderSessions(els.aiResults, response.scored, { empty: "I could not find a strong session match yet. Try adding a role, topic, room, CE need, or phrase from a session title." });
  } else {
    els.aiResults.innerHTML = "";
  }
}

function renderMyAiPanel() {
  if (!state.aiQuery) {
    els.myAiPanel.hidden = true;
    els.myAiAnswer.innerHTML = "";
    els.myAiReasons.innerHTML = "";
    els.myAiResults.innerHTML = "";
    return;
  }
  const response = getAiResponse(state.aiQuery);
  els.myAiPanel.hidden = false;
  renderAiAnswer(response.answer, els.myAiAnswer);
  renderAiReasons(response.profile, els.myAiReasons);
  if (response.shouldRecommendSessions) {
    renderSessions(els.myAiResults, response.scored, { empty: "AEC AI did not find a strong session match yet. Try adding a role, topic, room, CE need, or phrase from a session title." });
  } else {
    els.myAiResults.innerHTML = "";
  }
}

function getAiResponse(prompt) {
  const profile = buildProfile(prompt);
  const terms = expandTerms(tokenize(prompt));
  const answer = buildAiAnswer(prompt, profile, terms);
  const shouldRecommendSessions = profile.intent === "sessions" || profile.intent === "ce";
  const scored = shouldRecommendSessions ? state.sessions
    .filter((session) => session.category !== "Registration")
    .map((session) => ({ session, score: scoreSession(session, profile, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || sortSessions(a.session, b.session))
    .slice(0, 12)
    .map((item) => item.session) : [];
  return { answer, profile, shouldRecommendSessions, scored };
}

function buildProfile(prompt) {
  const lower = prompt.toLowerCase();
  const signals = [
    { keys: ["food", "restaurant", "retail", "foodborne", "inspector", "inspection", "haccp", "outbreak"], categories: ["Food Safety", "RFFM/Retail Program Standards"], tags: ["Food Safety & Defense", "Retail & Home Restaurants"], reason: "Prioritizing food safety, inspection, and retail program standards." },
    { keys: ["water", "pool", "aquatic", "well", "wastewater", "legionella", "splash", "recreational"], categories: ["Water Quality"], tags: ["Recreational Water", "Private Drinking Water", "Onsite Wastewater"], reason: "Looking for water quality, aquatic health, and recreational water sessions." },
    { keys: ["director", "leader", "manager", "workforce", "staff", "training", "mentor", "supervisor"], categories: ["Workforce & Leadership"], tags: ["Leadership & Management"], reason: "Adding leadership, workforce development, and training topics." },
    { keys: ["climate", "heat", "resilience", "emergency", "wildfire", "flood"], categories: ["Climate & Health", "Emergency Readiness, Recovery, & Resilience"], tags: ["Adaptation & Mitigation", "Extreme Heat"], reason: "Focusing on climate, heat, emergency readiness, and resilience." },
    { keys: ["data", "technology", "ai", "software", "dashboard", "analytics", "satellite"], categories: ["Data & Technology"], tags: ["Technology & Environmental Health", "Artificial Intelligence (AI)"], reason: "Elevating data, technology, AI, and analytics topics." },
    { keys: ["vector", "pest", "rodent", "mosquito", "tick", "zoonotic"], categories: ["Infectious & Vector-borne Diseases"], tags: ["Vector Control & Zoonotic Disease"], reason: "Matching vector control, pest, and zoonotic disease topics." },
    { keys: ["student", "career", "network", "job", "young professional"], categories: ["Networking Event"], tags: ["Student & Young Professional Career Development", "Networking Event"], reason: "Including networking and career-building options." },
    { keys: ["equity", "community", "housing", "healthy", "population", "tribal"], categories: ["Healthy Communities", "Focused Populations"], tags: ["Health Equity", "Healthy Homes"], reason: "Including community health, equity, and focused population content." },
    { keys: ["missouri", "kansas city", "local"], categories: ["Missouri Environmental Health"], tags: [], reason: "Looking for Missouri and Kansas City context." },
    { keys: ["ce", "credit", "credits"], categories: [], tags: [], reason: "Favoring sessions with CE credit." }
  ];
  const profile = {
    categories: new Set(),
    tags: new Set(),
    ce: lower.includes("ce") || lower.includes("credit"),
    workshop: lower.includes("workshop"),
    reasons: [],
    intent: detectIntent(lower)
  };
  signals.forEach((signal) => {
    if (signal.keys.some((key) => promptHasKey(lower, key))) {
      signal.categories.forEach((category) => profile.categories.add(category));
      signal.tags.forEach((tag) => profile.tags.add(tag));
      profile.reasons.push(signal.reason);
    }
  });
  if (!profile.reasons.length) profile.reasons.push("Searching across sessions, CE notes, venue guidance, Kansas City info, and uploaded HS GovTech material.");
  return profile;
}

function detectIntent(prompt) {
  if (/\b(kansas city|restaurant|coffee|bar|bbq|barbecue|attraction|things to do|nearby|eat|drink)\b/.test(prompt)) return "kc";
  if (/\b(ce|credit|credits|continuing education|certificate)\b/.test(prompt)) return "ce";
  if (/\b(hs govtech|hsgovtech|hscloud|hs cloud|hs cloudsuite|cloudsuite|demo|software|citizen portal|inspection portal|govcall|hs pay|hs analytics|regulatory platform|environmental health software|permitting software)\b/.test(prompt)) return "brand";
  if (/\b(where|room|floor|map|venue|located|location)\b/.test(prompt)) return "venue";
  return "sessions";
}

function isAiSearchPrompt(value) {
  const prompt = value.trim().toLowerCase();
  if (!prompt) return false;
  if (/\b(kc|kansas city|bbq|barbecue|restaurant|restaurants|coffee|bar|bars|attraction|attractions|nearby|eat|drink|food|room|rooms|venue|map|floor|ce|credit|credits|certificate|hs govtech|hsgovtech|hscloud|cloudsuite|demo|software|inspector|director|manager|student|career|water|pool|wastewater|climate|vector|pest|housing|equity)\b/.test(prompt)) return true;
  if (prompt.length < 8) return false;
  if (prompt.endsWith("?")) return true;
  if (/^(who|what|where|when|why|how|which|can|could|should|would|tell|recommend|suggest|give|find|show)\b/.test(prompt)) return true;
  if (/\b(recommend|suggest|best|should i attend|what sessions|which sessions|where is|tell me|help me|for my role|i am|i'm|i work|aec ai|hs govtech|hscloud|hs cloudsuite)\b/.test(prompt)) return true;
  return prompt.split(/\s+/).length >= 5;
}

function promptHasKey(prompt, key) {
  return new RegExp(`\\b${escapeRegExp(key)}s?\\b`, "i").test(prompt);
}

function scoreSession(session, profile, terms = []) {
  const haystack = `${session.title} ${session.category} ${session.tags.join(" ")} ${session.info}`.toLowerCase();
  let score = 0;
  if (profile.categories.has(session.category)) score += 7;
  session.tags.forEach((tag) => {
    if (profile.tags.has(tag)) score += 4;
  });
  if (profile.ce && Number(session.ce) > 0) score += Math.min(4, Number(session.ce));
  if (profile.workshop && haystack.includes("workshop")) score += 3;
  profile.categories.forEach((category) => {
    category.toLowerCase().split(/[^a-z]+/).filter(Boolean).forEach((word) => {
      if (haystack.includes(word)) score += 0.5;
    });
  });
  terms.forEach((term) => {
    if (session.title.toLowerCase().includes(term)) score += 4;
    if (session.category.toLowerCase().includes(term)) score += 2;
    if (session.tags.join(" ").toLowerCase().includes(term)) score += 2;
    if (session.info.toLowerCase().includes(term)) score += 1;
  });
  if (!profile.categories.size && !profile.tags.size && !terms.length) score = Number(session.ce) > 0 ? 1 : 0;
  return score;
}

function buildAiAnswer(prompt, profile, terms) {
  const docs = rankedKnowledgeDocs(prompt, terms, profile.intent).slice(0, 5);
  const roomAnswer = profile.intent === "venue" ? roomAnswerFor(prompt) : "";
  const places = profile.intent === "kc" ? rankedPlaces(terms).slice(0, 4) : [];
  const heading = answerHeading(profile.intent);
  const summary = roomAnswer || answerSummary(profile, docs, places);
  const bullets = answerBullets(profile.intent, docs, places);
  const sources = [...new Set(docs.map((doc) => doc.source).filter(Boolean))].slice(0, 4);
  return { heading, summary, bullets, sources };
}

function renderAiAnswer(answer, target = els.aiAnswer) {
  const bullets = answer.bullets.length ? `<ul>${answer.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
  const sources = answer.sources.length ? `<p class="ai-sources">Matched sources: ${answer.sources.map(escapeHtml).join(" | ")}</p>` : "";
  target.innerHTML = `
    <article>
      <h3>${escapeHtml(answer.heading)}</h3>
      <p>${escapeHtml(answer.summary)}</p>
      ${bullets}
      ${sources}
    </article>
  `;
}

function renderAiReasons(profile, target = els.aiReasons) {
  target.innerHTML = profile.reasons.map((reason) => `<span class="reason">${escapeHtml(reason)}</span>`).join("");
}

function answerHeading(intent) {
  if (intent === "ce") return "CE guidance";
  if (intent === "venue") return "Venue answer";
  if (intent === "kc") return "Kansas City guidance";
  if (intent === "brand") return "HS GovTech context";
  return "Recommended path";
}

function answerSummary(profile, docs, places) {
  if (profile.intent === "kc" && places.length) {
    return `I found several nearby options that fit that ask. Start with ${places.slice(0, 2).map((place) => place.name).join(" and ")}, then use Fun in KC for links, walk times, and more choices.`;
  }
  if (profile.intent === "ce") {
    return "For CE planning, favor sessions with listed CE credit and keep your attended sessions organized in MyNEHASchedule. The uploaded CE guide notes that NEHA credentials rely on continuing education contact hours during each credential cycle.";
  }
  if (profile.intent === "brand") {
    const lead = docs.find((doc) => doc.view === "brand") || docs[0];
    const base = lead ? firstSentence(lead.text) : "HS GovTech helps environmental health agencies modernize inspections, permitting, licensing, payments, reporting, and public-facing services in one configurable cloud platform.";
    return `${base} The simple pitch: HS CloudSuite gives EH teams a purpose-built digital headquarters that reduces workarounds, improves field productivity, gives leaders better visibility, and makes service easier for businesses and residents. Use Book Demo in the More menu for a follow-up conversation.`;
  }
  if (docs.length) {
    return `I found useful matches in the uploaded conference material. Based on your question, I would focus on ${docs[0].title.toLowerCase()} and the sessions below.`;
  }
  return "I did not find an exact match in the uploaded material, but I can still help you navigate. Try adding a role, topic, room, CE need, or phrase from a session title.";
}

function answerBullets(intent, docs, places) {
  if (intent === "kc" && places.length) {
    return places.map((place) => `${place.name}: ${place.meta}. ${place.description}`);
  }
  if (intent === "brand") {
    const brandDocs = docs.filter((doc) => doc.view === "brand").slice(0, 4);
    if (brandDocs.length) return brandDocs.map((doc) => `${doc.title}: ${firstSentence(doc.text)}`);
    return [
      "Purpose-built for EH: inspections, permitting, licensing, complaints, reporting, payments, and citizen services in one suite.",
      "Field-ready: HS Cloud Mobile supports offline inspections, photo capture, violation documentation, and secure sync.",
      "Leadership visibility: HS Analytics turns operational, workload, inspection, permit, and financial data into dashboards."
    ];
  }
  return docs.slice(0, 3).map((doc) => `${doc.title}: ${firstSentence(doc.text)}`);
}

function rankedKnowledgeDocs(prompt, terms, intent) {
  const phrase = prompt.toLowerCase();
  return getKnowledgeDocs()
    .map((doc) => ({ doc, score: scoreKnowledgeDoc(doc, terms, phrase, intent) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.doc);
}

function getKnowledgeDocs() {
  if (knowledgeDocs) return knowledgeDocs;
  const docs = [];
  state.sessions.forEach((session) => {
    docs.push({
      source: "NEHA AEC 2026 Session Schedule",
      title: session.title,
      text: `${session.time} in ${session.location}. Category: ${session.category}. Tags: ${session.tags.join(", ")}. CE: ${session.ceDisplay}. ${session.info}`,
      view: "sessions"
    });
  });
  (state.guide?.knowledge || []).forEach((chunk) => {
    docs.push({
      source: chunk.source || "Uploaded Knowledge Docs",
      title: chunk.title || chunk.source || "Knowledge note",
      text: chunk.text || "",
      view: classifyKnowledgeView(chunk.source, chunk.title, chunk.text)
    });
  });
  (state.guide?.ce?.summary || []).forEach((text, index) => docs.push({ source: state.guide.ce.source, title: `CE note ${index + 1}`, text, view: "ce" }));
  (state.guide?.hotel?.summary || []).forEach((text, index) => docs.push({ source: state.guide.hotel.source, title: `Venue note ${index + 1}`, text, view: "venue" }));
  (state.guide?.brand?.positioning || []).forEach((text, index) => docs.push({ source: state.guide.brand.source, title: `HS GovTech note ${index + 1}`, text, view: "brand" }));
  knowledgeDocs = docs.map((doc) => ({ ...doc, tokens: tokenize(`${doc.title} ${doc.source} ${doc.text}`) }));
  return knowledgeDocs;
}

function scoreKnowledgeDoc(doc, terms, phrase, intent) {
  if (!terms.length) return 0;
  const title = doc.title.toLowerCase();
  const source = doc.source.toLowerCase();
  const text = doc.text.toLowerCase();
  let score = 0;
  terms.forEach((term) => {
    if (title.includes(term)) score += 7;
    if (source.includes(term)) score += 4;
    if (text.includes(term)) score += 1.5;
  });
  if (phrase.length > 8 && text.includes(phrase)) score += 10;
  if (intent && intent !== "sessions") {
    if (doc.view === intent) score += 12;
    if (doc.view !== intent && doc.view !== "sessions") score *= 0.35;
  }
  return score;
}

function classifyKnowledgeView(source = "", title = "", text = "") {
  const haystack = `${source} ${title} ${text}`.toLowerCase();
  if (haystack.includes("continuing education") || haystack.includes("ce requirement")) return "ce";
  if (haystack.includes("hs govtech") || haystack.includes("hs cloud") || haystack.includes("govcall") || haystack.includes("citizen portal")) return "brand";
  if (haystack.includes("sheraton") || haystack.includes("floor plan") || haystack.includes("exhibit hall")) return "venue";
  if (haystack.includes("kansas city") || haystack.includes("locations near hotel") || haystack.includes("crown center")) return "kc";
  return "knowledge";
}

function rankedPlaces(terms) {
  return (state.guide?.nearby || [])
    .map((place) => {
      const text = `${place.name} ${place.category} ${place.meta} ${place.description}`.toLowerCase();
      let score = 0;
      terms.forEach((term) => {
        if (text.includes(term)) score += 1;
      });
      if (!score && /coffee|barbecue|dining|casual|nightlife|spirits|exploration|pharmacies|grocery|essentials|outdoors/i.test(place.category)) score = 0.5;
      return { place, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .map((item) => item.place);
}

function roomAnswerFor(prompt) {
  const lower = prompt.toLowerCase();
  const roomKey = Object.keys(state.guide?.roomFloors || {}).find((room) => lower.includes(room));
  if (!roomKey) return "";
  const roomName = roomKey.replace(/\b\w/g, (char) => char.toUpperCase());
  return `${roomName} is on the ${state.guide.roomFloors[roomKey]}. Use the Venue tab for the exhibit hall and conference complex maps.`;
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stopWords.has(term))
    .map((term) => term.length > 4 ? term.replace(/s$/, "") : term)
    .filter((term) => term.length > 2 && !stopWords.has(term));
}

function expandTerms(terms) {
  const synonyms = {
    inspector: ["inspection", "inspections", "retail", "food"],
    restaurant: ["retail", "food", "foodservice"],
    pool: ["aquatic", "recreational", "water"],
    ai: ["artificial", "intelligence", "technology"],
    ce: ["credit", "credits", "continuing", "education"],
    demo: ["hscloud", "cloudsuite", "software", "govtech"],
    govtech: ["hsgovtech", "cloudsuite", "environmental", "health"],
    hscloud: ["cloudsuite", "govtech", "software"],
    cloudsuite: ["hscloud", "govtech", "software", "inspection", "permitting"],
    permitting: ["licensing", "portal", "payments"],
    inspections: ["mobile", "offline", "violations"],
    bbq: ["barbecue"],
    kc: ["kansas", "city"]
  };
  const expanded = new Set(terms);
  terms.forEach((term) => (synonyms[term] || []).forEach((synonym) => expanded.add(synonym)));
  return [...expanded];
}

function firstSentence(text) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  const match = cleaned.match(/^(.{40,220}?[.!?])\s/);
  return match ? match[1] : `${cleaned.slice(0, 220)}${cleaned.length > 220 ? "..." : ""}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderPlaces() {
  const places = state.guide.nearby.filter((place) => state.placeFilter === "all" || place.category === state.placeFilter);
  els.kcSourceLinks.innerHTML = state.guide.kcSources.map((source) => `<a href="${escapeAttr(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.name)}</a>`).join("");
  els.placeGrid.innerHTML = places.map((place) => `
    <article class="place-card" data-place-card="${state.guide.nearby.indexOf(place)}">
      <div class="place-badges">
        <span class="place-category">${escapeHtml(place.category)}</span>
        ${shouldSuggestRideshare(place) ? `<span class="rideshare-suggestion">May want rideshare</span>` : ""}
      </div>
      <a class="place-title" href="${escapeAttr(placeUrl(place))}" target="_blank" rel="noreferrer">${escapeHtml(place.name)}</a>
      <small>${escapeHtml(place.meta)}</small>
      <p>${escapeHtml(place.description)}</p>
      <div class="place-actions">
        <a href="${escapeAttr(placeUrl(place))}" target="_blank" rel="noreferrer">View map</a>
        <button type="button" data-place-directions="${state.guide.nearby.indexOf(place)}">Walk</button>
        <button class="rideshare-button" type="button" data-place-rideshare="${state.guide.nearby.indexOf(place)}" aria-expanded="false">Rideshare</button>
      </div>
      <div class="rideshare-options" hidden>
        <a href="${escapeAttr(uberUrl(place))}" rel="noreferrer">Uber</a>
        <a href="${escapeAttr(lyftUrl(place))}" target="_blank" rel="noreferrer">Lyft</a>
      </div>
    </article>
  `).join("");
}

function renderVenue() {
  const map = venueMaps[state.venueMap];
  els.venueMapImage.src = map.src;
  els.venueMapImage.alt = map.alt;
  els.venueMapCaption.textContent = map.caption;
  els.venueMapTabs.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.map === state.venueMap));
  const tips = [
    ...state.guide.hotel.summary.slice(2, 8),
    "Room hints: Atlanta, New York, San Francisco, Chicago, Chouteau, Empire, The Terrace, and Exhibit Hall spaces are mapped from the uploaded Sheraton floor-plan packet."
  ];
  els.hotelTips.innerHTML = tips.map((tip) => `<div class="info-note">${escapeHtml(tip)}</div>`).join("");
}

function renderPodcast() {
  els.podcastGrid.innerHTML = podcastEpisodes.map((episode) => `
    <article class="podcast-card">
      <a class="video-frame" href="${escapeAttr(episode.url)}" target="_blank" rel="noreferrer" aria-label="Play ${escapeAttr(episode.title)} on YouTube">
        <img src="${escapeAttr(episode.thumbnail)}" alt="">
        <span>Play</span>
      </a>
      <div class="podcast-card-body">
        <p class="session-kicker">${escapeHtml(episode.published)}</p>
        <h3>${escapeHtml(episode.title)}</h3>
        <p>${escapeHtml(episode.description)}</p>
        <a href="${escapeAttr(episode.url)}" target="_blank" rel="noreferrer">Watch on YouTube</a>
      </div>
    </article>
  `).join("");
}

function renderCommunity() {
  els.communityCategories.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.communityCategory === state.communityCategory);
  });
  if (!els.communityCategoryInput.value) els.communityCategoryInput.value = "unique-problems";
  if (state.communityCategory !== "all" && els.communityCategoryInput.value !== state.communityCategory) {
    els.communityCategoryInput.value = state.communityCategory;
  }
  renderCommunityImageField();

  const posts = state.communityPosts
    .filter((post) => state.communityCategory === "all" || post.category === state.communityCategory)
    .slice(0, 30);

  if (state.communityLoading && !posts.length) {
    els.communityPosts.innerHTML = `<div class="empty-state">Loading community posts...</div>`;
    return;
  }
  if (!posts.length) {
    els.communityPosts.innerHTML = `<div class="empty-state">No posts here yet. Be the first to start this conversation.</div>`;
    return;
  }

  els.communityPosts.innerHTML = posts.map((post) => {
    const category = communityCategoryLabel(post.category);
    const email = post.shareEmail && post.email ? `<a href="mailto:${escapeAttr(post.email)}?subject=${encodeURIComponent(`NEHA Community Connect: ${post.title}`)}">Email ${escapeHtml(post.displayName || "attendee")}</a>` : "";
    const imageUrl = safeImageUrl(post.imageUrl);
    const image = imageUrl ? `<img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(post.title)}" loading="lazy">` : "";
    const replies = Array.isArray(post.replies) ? post.replies.slice(0, 20) : [];
    const replyLabel = `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`;
    return `
      <article class="community-post">
        <div class="community-post-head">
          <span>${escapeHtml(category)}</span>
          <small>${escapeHtml(relativePostTime(post.postedAt))}</small>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.message)}</p>
        ${image}
        <div class="community-byline">
          <strong>${escapeHtml(post.displayName || "NEHA attendee")}</strong>
          <span>${escapeHtml(post.agency || "Environmental health community")}</span>
          ${email}
        </div>
        <section class="community-thread" aria-label="${escapeAttr(post.title)} replies">
          <div class="community-thread-head">
            <strong>${replyLabel}</strong>
          </div>
          <div class="community-replies">
            ${replies.length ? replies.map((reply) => `
              <div class="community-reply">
                <p>${escapeHtml(reply.message || "")}</p>
                <div>
                  <strong>${escapeHtml(reply.displayName || "NEHA attendee")}</strong>
                  <span>${escapeHtml(reply.agency || "Environmental health community")}</span>
                  <small>${escapeHtml(relativePostTime(reply.postedAt))}</small>
                </div>
              </div>
            `).join("") : `<div class="community-reply-empty">Start the thread with a helpful reply.</div>`}
          </div>
          <form class="community-reply-form" data-post-id="${escapeAttr(post.id || "")}">
            <label>
              Reply to this thread
              <textarea name="reply" rows="2" maxlength="500" placeholder="Add a helpful reply..." required></textarea>
            </label>
            <button type="submit">Reply</button>
            <span class="community-reply-status" aria-live="polite"></span>
          </form>
        </section>
      </article>
    `;
  }).join("");
}

function loadCommunityPosts() {
  const endpoint = window.NEHA_LEAD_ENDPOINT || "";
  if (!endpoint) {
    renderCommunity();
    return Promise.resolve();
  }
  state.communityLoading = true;
  renderCommunity();
  return loadJsonp(endpoint, { action: "communityPosts" })
    .then((data) => {
      state.communityPosts = Array.isArray(data?.posts) ? data.posts : [];
      state.communityLoaded = true;
    })
    .catch((error) => {
      console.warn("Community posts could not load", error);
    })
    .finally(() => {
      state.communityLoading = false;
      renderCommunity();
    });
}

function renderCommunityImageField() {
  const category = els.communityCategoryInput.value || "unique-problems";
  const pictureFirst = category === "kc-images" || category === "find-violation";
  els.communityImageField.classList.toggle("picture-first", pictureFirst);
  els.communityImageLabel.textContent = pictureFirst ? "Attach photo" : "Attach image";
  const button = els.communityImageField.querySelector(".community-file-button");
  if (button) {
    const labelText = pictureFirst ? "Choose Photo" : "Choose Image";
    button.childNodes[button.childNodes.length - 1].textContent = labelText;
  }
}

function renderCommunityImagePreview() {
  if (!state.communityImage) {
    els.communityImagePreview.hidden = true;
    els.communityImagePreview.innerHTML = "";
    return;
  }
  const sizeKb = Math.round(state.communityImage.size / 1024);
  els.communityImagePreview.hidden = false;
  els.communityImagePreview.innerHTML = `
    <img src="${escapeAttr(state.communityImage.dataUrl)}" alt="Selected community upload preview">
    <span>${escapeHtml(state.communityImage.name)} &middot; ${sizeKb} KB</span>
  `;
}

function compressCommunityImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.68);
        resolve({
          dataUrl,
          name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
          mimeType: "image/jpeg",
          size: Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75)
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderTrivia() {
  ensureTriviaRound();
  const trivia = state.trivia;
  const board = activeTriviaBoard();
  const questions = activeTriviaQuestions();
  const total = questions.length;
  renderTriviaBoardPicker();
  els.triviaBoardEyebrow.textContent = board.eyebrow;
  els.triviaBoardDescription.textContent = board.description;
  els.triviaScore.textContent = `${trivia.score}/${total}`;
  els.triviaProgressBar.style.width = `${Math.round((trivia.index / total) * 100)}%`;

  if (trivia.complete) {
    if (!trivia.submitted && !trivia.submitting && !trivia.leaderboardError) window.setTimeout(postTriviaScore, 0);
    renderTriviaResults();
    return;
  }

  const question = questions[trivia.index];
  const status = trivia.answered ? (trivia.selected === question.answer ? "Correct" : "Not quite") : "Choose one";
  els.triviaStage.innerHTML = `
    <div class="trivia-card">
      <div class="trivia-meta">
        <span>Question ${trivia.index + 1} of ${total}</span>
        <span>${escapeHtml(question.category)}</span>
        <span>${escapeHtml(question.section)}</span>
      </div>
      <h3>${escapeHtml(question.question)}</h3>
      <div class="answer-grid">
        ${triviaOptionOrder(question).map((index) => triviaAnswerButton(question, question.options[index], index)).join("")}
      </div>
      <div class="trivia-feedback ${trivia.answered ? "show" : ""}">
        <strong>${escapeHtml(status)}</strong>
        <p>${trivia.answered ? escapeHtml(question.explanation) : `Lock in an answer to reveal the ${escapeHtml(board.sourceNote)}.`}</p>
      </div>
      <div class="trivia-footer">
        <button class="hint-button" type="button" data-trivia-hint ${trivia.answered || trivia.hintsRemaining <= 0 || hiddenTriviaOptions().length >= question.options.length - 2 ? "disabled" : ""}>Use Hint (${trivia.hintsRemaining})</button>
        <div>
          <span>Streak</span>
          <strong>${trivia.streak}</strong>
        </div>
        <div>
          <span>Best</span>
          <strong>${trivia.best}/${total}</strong>
        </div>
        <button type="button" data-trivia-next ${trivia.answered ? "" : "disabled"}>${trivia.index === total - 1 ? "Finish" : "Next"}</button>
      </div>
    </div>
  `;
}

function renderTriviaBoardPicker() {
  els.triviaBoardPicker.innerHTML = Object.values(triviaBoards).map((board) => `
    <button type="button" data-trivia-board="${escapeAttr(board.id)}" class="${board.id === state.triviaBoard ? "active" : ""}" aria-pressed="${board.id === state.triviaBoard}">
      <span>${escapeHtml(board.shortLabel)}</span>
      <small>${escapeHtml(board.label)}</small>
    </button>
  `).join("");
}

function activeTriviaBoard() {
  return triviaBoards[state.triviaBoard] || triviaBoards.food;
}

function activeTriviaQuestions() {
  const board = activeTriviaBoard();
  if (!state.trivia.questionIndexes?.length) return board.questions.slice(0, Math.min(TRIVIA_ROUND_SIZE, board.questions.length));
  return state.trivia.questionIndexes
    .map((index) => board.questions[index])
    .filter(Boolean);
}

function activeTriviaAchievements() {
  return activeTriviaBoard().achievements;
}

function triviaRoundStorageKey(boardId = state.triviaBoard) {
  return `${TRIVIA_ROUND_STORAGE_PREFIX}:${boardId}`;
}

function triviaBestScore(board = activeTriviaBoard()) {
  const primary = Number(localStorage.getItem(board.bestKey) || 0);
  const legacy = board.legacyBestKey ? Number(localStorage.getItem(board.legacyBestKey) || 0) : 0;
  return Math.max(primary || 0, legacy || 0);
}

function setTriviaBoard(boardId) {
  if (!triviaBoards[boardId] || boardId === state.triviaBoard) return;
  state.triviaBoard = boardId;
  localStorage.setItem("nehaTriviaBoard", boardId);
  state.trivia = {
    ...freshTriviaState(),
    ...loadStoredTriviaRound(boardId),
    leaderboard: [],
    leaderboardLoading: false,
    leaderboardError: "",
    submitting: false,
    best: triviaBestScore(triviaBoards[boardId])
  };
  normalizeTriviaRound();
  loadTriviaLeaderboard();
  renderTrivia();
}

function triviaAnswerButton(question, option, index) {
  const trivia = state.trivia;
  let stateClass = "";
  if (trivia.answered && index === question.answer) stateClass = "correct";
  if (trivia.answered && trivia.selected === index && index !== question.answer) stateClass = "wrong";
  if (!trivia.answered && hiddenTriviaOptions().includes(index)) stateClass = "hidden";
  return `<button class="${stateClass}" type="button" data-answer="${index}" ${stateClass === "hidden" ? "disabled" : ""}>${escapeHtml(option)}</button>`;
}

function triviaOptionOrder(question) {
  if (!state.trivia.order.length) resetTriviaOrder();
  return state.trivia.order[state.trivia.index] || question.options.map((_, index) => index);
}

function hiddenTriviaOptions() {
  return state.trivia.hidden[state.trivia.index] || [];
}

function resetTriviaOrder() {
  state.trivia.order = activeTriviaQuestions().map((question) => shuffleArray(question.options.map((_, index) => index)));
}

function resetTriviaQuestionSet() {
  const board = activeTriviaBoard();
  const indexes = board.questions.map((_, index) => index);
  state.trivia.questionIndexes = shuffleArray(indexes).slice(0, Math.min(TRIVIA_ROUND_SIZE, indexes.length));
  resetTriviaOrder();
}

function loadStoredTriviaRound(boardId = localStorage.getItem("nehaTriviaBoard") || "food") {
  try {
    const stored = JSON.parse(localStorage.getItem(triviaRoundStorageKey(boardId)) || (boardId === "food" ? localStorage.getItem("nehaTriviaRound") : "null") || "null");
    if (!stored || typeof stored !== "object") return {};
    const legacyQuestionIndexes = boardId === "food" && stored.roundId && !Array.isArray(stored.questionIndexes)
      ? Array.from({ length: TRIVIA_ROUND_SIZE }, (_, index) => index)
      : [];
    return {
      index: Number(stored.index) || 0,
      score: Number(stored.score) || 0,
      selected: Number.isInteger(stored.selected) ? stored.selected : null,
      answered: Boolean(stored.answered),
      complete: Boolean(stored.complete),
      streak: Number(stored.streak) || 0,
      hintsRemaining: Number.isFinite(Number(stored.hintsRemaining)) ? Number(stored.hintsRemaining) : 3,
      hidden: stored.hidden && typeof stored.hidden === "object" ? stored.hidden : {},
      submitted: Boolean(stored.submitted),
      submitting: false,
      order: Array.isArray(stored.order) ? stored.order : [],
      questionIndexes: Array.isArray(stored.questionIndexes) ? stored.questionIndexes.filter((index) => Number.isInteger(index)) : legacyQuestionIndexes,
      roundId: stored.roundId || "",
      startedAt: stored.startedAt || "",
      completedAt: stored.completedAt || ""
    };
  } catch (error) {
    console.warn("Stored trivia round could not be restored", error);
    return {};
  }
}

function freshTriviaState() {
  return {
    index: 0,
    score: 0,
    selected: null,
    answered: false,
    complete: false,
    streak: 0,
    hintsRemaining: 3,
    hidden: {},
    submitted: false,
    submitting: false,
    leaderboard: [],
    leaderboardLoading: false,
    leaderboardError: "",
    order: [],
    questionIndexes: [],
    best: triviaBestScore(),
    roundId: "",
    startedAt: "",
    completedAt: ""
  };
}

function ensureTriviaRound() {
  if (!state.trivia.roundId) {
    state.trivia.roundId = `round-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    state.trivia.startedAt = new Date().toISOString();
  }
  if (!state.trivia.questionIndexes?.length) resetTriviaQuestionSet();
  if (!state.trivia.order.length) resetTriviaOrder();
  persistTriviaRound();
}

function normalizeTriviaRound() {
  const board = activeTriviaBoard();
  const expectedCount = Math.min(TRIVIA_ROUND_SIZE, board.questions.length);
  const invalidDraw = !state.trivia.questionIndexes?.length
    || state.trivia.questionIndexes.length !== expectedCount
    || state.trivia.questionIndexes.some((index) => !Number.isInteger(index) || index < 0 || index >= board.questions.length);
  if (invalidDraw) resetTriviaQuestionSet();
  const total = activeTriviaQuestions().length;
  state.trivia.index = Math.min(Math.max(Number(state.trivia.index) || 0, 0), total - 1);
  state.trivia.score = Math.min(Math.max(Number(state.trivia.score) || 0, 0), total);
  state.trivia.streak = Math.min(Math.max(Number(state.trivia.streak) || 0, 0), total);
  state.trivia.hintsRemaining = Math.min(Math.max(Number(state.trivia.hintsRemaining) || 0, 0), 3);
  state.trivia.best = triviaBestScore();
  if (!state.trivia.order.length || state.trivia.order.length !== total) resetTriviaOrder();
  if (state.trivia.roundId) persistTriviaRound();
}

function persistTriviaRound() {
  const round = {
    roundId: state.trivia.roundId,
    startedAt: state.trivia.startedAt,
    completedAt: state.trivia.completedAt,
    index: state.trivia.index,
    score: state.trivia.score,
    selected: state.trivia.selected,
    answered: state.trivia.answered,
    complete: state.trivia.complete,
    streak: state.trivia.streak,
    hintsRemaining: state.trivia.hintsRemaining,
    hidden: state.trivia.hidden,
    submitted: state.trivia.submitted,
    order: state.trivia.order,
    questionIndexes: state.trivia.questionIndexes
  };
  localStorage.setItem(triviaRoundStorageKey(), JSON.stringify(round));
}

function shuffleArray(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function useTriviaHint() {
  const question = activeTriviaQuestions()[state.trivia.index];
  if (state.trivia.answered || state.trivia.hintsRemaining <= 0) return;
  const hidden = hiddenTriviaOptions();
  const candidates = triviaOptionOrder(question).filter((index) => index !== question.answer && !hidden.includes(index));
  if (!candidates.length) return;
  const removed = candidates[Math.floor(Math.random() * candidates.length)];
  state.trivia.hidden[state.trivia.index] = [...hidden, removed];
  state.trivia.hintsRemaining -= 1;
  persistTriviaRound();
  renderTrivia();
}

function answerTrivia(index) {
  const question = activeTriviaQuestions()[state.trivia.index];
  state.trivia.selected = index;
  state.trivia.answered = true;
  if (index === question.answer) {
    state.trivia.score += 1;
    state.trivia.streak += 1;
  } else {
    state.trivia.streak = 0;
  }
  persistTriviaRound();
  renderTrivia();
}

function nextTriviaQuestion() {
  if (!state.trivia.answered) return;
  const questions = activeTriviaQuestions();
  const board = activeTriviaBoard();
  if (state.trivia.index >= questions.length - 1) {
    state.trivia.complete = true;
    state.trivia.completedAt = new Date().toISOString();
    state.trivia.best = Math.max(state.trivia.best, state.trivia.score);
    localStorage.setItem(board.bestKey, String(state.trivia.best));
    if (board.legacyBestKey) localStorage.setItem(board.legacyBestKey, String(state.trivia.best));
    persistTriviaRound();
    postTriviaScore();
  } else {
    state.trivia.index += 1;
    state.trivia.selected = null;
    state.trivia.answered = false;
    persistTriviaRound();
  }
  renderTrivia();
}

function restartTrivia() {
  state.trivia.index = 0;
  state.trivia.score = 0;
  state.trivia.selected = null;
  state.trivia.answered = false;
  state.trivia.complete = false;
  state.trivia.streak = 0;
  state.trivia.hintsRemaining = 3;
  state.trivia.hidden = {};
  state.trivia.submitted = false;
  state.trivia.submitting = false;
  state.trivia.leaderboardError = "";
  state.trivia.best = triviaBestScore();
  state.trivia.questionIndexes = [];
  state.trivia.roundId = `round-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  state.trivia.startedAt = new Date().toISOString();
  state.trivia.completedAt = "";
  resetTriviaQuestionSet();
  persistTriviaRound();
  renderTrivia();
}

function renderTriviaResults() {
  const board = activeTriviaBoard();
  const achievements = activeTriviaAchievements();
  const total = activeTriviaQuestions().length;
  const achievement = achievements.find((item) => state.trivia.score >= item.min);
  const perfect = state.trivia.score === total;
  const postStatus = state.trivia.submitted ? "Score posted to the leaderboard." : state.trivia.submitting ? "Posting score to the leaderboard..." : "Score will post automatically.";
  els.triviaProgressBar.style.width = "100%";
  els.triviaStage.innerHTML = `
    <div class="trivia-result">
      <p class="eyebrow">Round complete</p>
      <h3>${escapeHtml(achievement.title)}</h3>
      <div class="result-score">${state.trivia.score}<span>/${total}</span></div>
      <p>${escapeHtml(achievement.note)}</p>
      ${perfect ? `
        <div class="perfect-prize">
          <strong>Congrats, 12 for 12!</strong>
          <span>Go to the HS GovTech booth for a special prize.</span>
        </div>
      ` : ""}
      <div class="score-actions">
        <span>${escapeHtml(postStatus)}</span>
        <button type="button" data-trivia-refresh>Refresh Leaderboard</button>
      </div>
      ${renderLeaderboard()}
      <div class="achievement-list">
        ${achievements.map((item) => `
          <div class="${state.trivia.score >= item.min ? "earned" : ""}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${item.min}+ correct</span>
          </div>
        `).join("")}
      </div>
      <button type="button" data-trivia-restart>Play Again</button>
    </div>
  `;
}

function renderLeaderboard() {
  if (state.trivia.leaderboardLoading) return `<div class="leaderboard-card">Loading leaderboard...</div>`;
  if (state.trivia.leaderboardError) return `<div class="leaderboard-card">${escapeHtml(state.trivia.leaderboardError)}</div>`;
  if (!state.trivia.leaderboard.length) return `<div class="leaderboard-card">Post a score to start the leaderboard.</div>`;
  const board = activeTriviaBoard();
  return `
    <div class="leaderboard-card">
      <div class="leaderboard-head">
        <strong>${escapeHtml(board.label)} Leaderboard</strong>
        <span>Top ${state.trivia.leaderboard.length}</span>
      </div>
      ${state.trivia.leaderboard.map((entry) => `
        <div class="leaderboard-row">
          <span>${escapeHtml(String(entry.rank))}</span>
          <strong>${escapeHtml(entry.name)}</strong>
          <small>${escapeHtml(entry.agency || "Agency not listed")}</small>
          <b>${escapeHtml(String(entry.score))}/${escapeHtml(String(entry.total || activeTriviaQuestions().length))}</b>
        </div>
      `).join("")}
    </div>
  `;
}

async function postTriviaScore() {
  if (state.trivia.submitted || state.trivia.submitting) return;
  state.trivia.submitting = true;
  renderTrivia();
  const board = activeTriviaBoard();
  const achievement = activeTriviaAchievements().find((item) => state.trivia.score >= item.min);
  const payload = {
    type: "triviaScore",
    boardId: board.id,
    boardName: board.label,
    name: state.lead?.name || "",
    agency: state.lead?.agency || "",
    email: state.lead?.email || "",
    score: state.trivia.score,
    total: activeTriviaQuestions().length,
    achievement: achievement.title,
    hintsUsed: 3 - state.trivia.hintsRemaining,
    roundId: state.trivia.roundId,
    startedAt: state.trivia.startedAt,
    completedAt: state.trivia.completedAt || new Date().toISOString(),
    source: "NEHA AEC 2026 Guide",
    page: location.href
  };
  try {
    await submitAppPayload(payload);
    state.trivia.submitted = true;
    persistTriviaRound();
    await loadTriviaLeaderboard();
  } catch (error) {
    state.trivia.leaderboardError = "Could not post score yet. Check connection and try again.";
    console.error(error);
  } finally {
    state.trivia.submitting = false;
    persistTriviaRound();
    renderTrivia();
  }
}

function loadTriviaLeaderboard() {
  const endpoint = window.NEHA_LEAD_ENDPOINT || "";
  if (!endpoint) {
    state.trivia.leaderboardError = "Leaderboard is not configured yet.";
    renderTrivia();
    return Promise.resolve();
  }
  state.trivia.leaderboardLoading = true;
  state.trivia.leaderboardError = "";
  renderTrivia();
  return new Promise((resolve) => {
    const callbackName = `nehaLeaderboard${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      state.trivia.leaderboardLoading = false;
      state.trivia.leaderboardError = "Leaderboard is taking a breather. Try refresh in a moment.";
      renderTrivia();
      resolve();
    }, 8000);
    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }
    window[callbackName] = (data) => {
      cleanup();
      state.trivia.leaderboard = Array.isArray(data?.leaders) ? data.leaders : [];
      state.trivia.leaderboardLoading = false;
      renderTrivia();
      resolve();
    };
    script.src = `${endpoint}?action=leaderboard&boardId=${encodeURIComponent(activeTriviaBoard().id)}&callback=${callbackName}&t=${Date.now()}`;
    script.onerror = () => {
      cleanup();
      state.trivia.leaderboardLoading = false;
      state.trivia.leaderboardError = "Leaderboard could not load yet.";
      renderTrivia();
      resolve();
    };
    document.body.appendChild(script);
  });
}

function toggleSaved(kind, id) {
  if (state.saved[kind][id]) {
    delete state.saved[kind][id];
    delete state.reminders[id];
    localStorage.setItem("nehaSessionReminders", JSON.stringify(state.reminders));
  } else {
    if (kind === "attend" || kind === "watch") {
      const session = sessionById(id);
      const conflicts = findConflicts(session);
      if (conflicts.length) {
        state.pendingConflict = { kind, id, conflicts: conflicts.map((conflict) => conflict.id) };
        state.myMode = "day";
        state.myDay = session.date;
        setView("my");
        return;
      }
    }
    state.saved[kind][id] = true;
    if (kind === "attend") state.saved.watch[id] = true;
  }
  persistSaved();
  renderAll();
  checkLocalSessionReminders();
}

function sessionEmailPayload(session) {
  return {
    id: session.id,
    title: session.title,
    rawDate: session.date,
    date: formatDate(session.date),
    time: session.time,
    start: session.start,
    end: session.end,
    location: session.location,
    category: session.category,
    ce: session.ceDisplay || ""
  };
}

function renderConflictBanner() {
  if (!state.pendingConflict) {
    els.conflictBanner.hidden = true;
    els.conflictBanner.innerHTML = "";
    return;
  }
  const session = sessionById(state.pendingConflict.id);
  const kind = state.pendingConflict.kind || "attend";
  const conflicts = state.pendingConflict.conflicts.map(sessionById).filter(Boolean);
  if (!session || !conflicts.length) {
    state.pendingConflict = null;
    els.conflictBanner.hidden = true;
    els.conflictBanner.innerHTML = "";
    return;
  }
  els.conflictBanner.hidden = false;
  els.conflictBanner.innerHTML = `
    <div>
      <strong>So much goodness - you have a choice to make</strong>
      <p>${escapeHtml(session.title)} on ${escapeHtml(dayLabel(session.date))} (${escapeHtml(session.time)}) overlaps with ${escapeHtml(conflicts.map((conflict) => `${conflict.title} on ${dayLabel(conflict.date)} (${conflict.time})`).join("; "))}.</p>
    </div>
    <div class="conflict-actions">
      <button type="button" data-conflict="cancel">Keep current</button>
      <button type="button" data-conflict="add">Add anyway</button>
    </div>
  `;
  els.conflictBanner.querySelector('[data-conflict="cancel"]').addEventListener("click", () => {
    state.pendingConflict = null;
    renderConflictBanner();
  });
  els.conflictBanner.querySelector('[data-conflict="add"]').addEventListener("click", () => {
    state.saved[kind][session.id] = true;
    if (kind === "attend") state.saved.watch[session.id] = true;
    state.pendingConflict = null;
    persistSaved();
    renderAll();
  });
}

function findConflicts(session) {
  if (!session) return [];
  return getSavedSessions().filter((saved) => saved.id !== session.id && saved.date === session.date && session.start < saved.end && session.end > saved.start);
}

function sessionById(id) {
  return state.sessions.find((session) => session.id === id);
}

function placeUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeMapQuery(place))}`;
}

function walkingDirectionsUrl(place) {
  const destination = encodeURIComponent(placeMapQuery(place));
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
}

function uberUrl(place) {
  const destination = rideshareDestination(place);
  const coords = rideshareCoordinates(place);
  const params = [
    ["action", "setPickup"],
    ["pickup", "my_location"],
    ["dropoff[formatted_address]", destination],
    ["dropoff[nickname]", place.name]
  ];

  if (coords) {
    params.push(["dropoff[latitude]", coords.lat]);
    params.push(["dropoff[longitude]", coords.lng]);
  }

  return `https://m.uber.com/ul/?${params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&")}`;
}

function lyftUrl(place) {
  const destination = encodeURIComponent(placeMapQuery(place));
  return `https://www.lyft.com/rider?destination=${destination}`;
}

function placeMapQuery(place) {
  return `${place.name}, ${placeAddress(place)}`.replace(/\s+/g, " ").trim();
}

function rideshareDestination(place) {
  return `${place.name}, ${placeAddress(place)}`.replace(/\s+/g, " ").trim();
}

function rideshareCoordinates(place) {
  return rideshareCoordinateMap[normalizeAddress(placeAddress(place))] || null;
}

function placeAddress(place) {
  let address = place.meta.split("—")[0].trim();
  if (/crown center/i.test(address)) address = "2450 Grand Blvd";
  if (/union station/i.test(address)) address = "30 W Pershing Rd";
  if (/the westin/i.test(address)) address = "1 E Pershing Rd";
  if (/sheraton|hotel lobby|inside the sheraton/i.test(address)) address = "2345 McGee St";
  address = address.replace(/,\s*(level|lobby level).*$/i, "").trim();
  if (!address || !/\d/.test(address) || /^(inside|hotel lobby|connected)/i.test(address)) {
    return "Kansas City, MO";
  }
  return `${address}, Kansas City, MO`;
}

function normalizeAddress(address) {
  return address.toLowerCase().replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim();
}

const rideshareCoordinateMap = {
  [normalizeAddress("2345 Grand Blvd, Kansas City, MO")]: { lat: "39.0846722", lng: "-94.5812608" },
  [normalizeAddress("1624 Grand Blvd, Kansas City, MO")]: { lat: "39.0935183", lng: "-94.5816209" },
  [normalizeAddress("30 W Pershing Rd, Kansas City, MO")]: { lat: "39.0853037", lng: "-94.5857704" },
  [normalizeAddress("2980 McGee Trafficway, Kansas City, MO")]: { lat: "39.0772407", lng: "-94.5803587" },
  [normalizeAddress("2450 Grand Blvd, Kansas City, MO")]: { lat: "39.0825550", lng: "-94.5824390" },
  [normalizeAddress("1 E Pershing Rd, Kansas City, MO")]: { lat: "39.0827401", lng: "-94.5830320" },
  [normalizeAddress("2460 Pershing Road, Kansas City, MO")]: { lat: "39.0823729", lng: "-94.5789893" },
  [normalizeAddress("101 W 22nd St, Kansas City, MO")]: { lat: "39.0874708", lng: "-94.5853595" },
  [normalizeAddress("1927 McGee St, Kansas City, MO")]: { lat: "39.0892837", lng: "-94.5798486" },
  [normalizeAddress("2000 Grand Blvd, Kansas City, MO")]: { lat: "39.0888726", lng: "-94.5818613" },
  [normalizeAddress("2345 McGee St, Kansas City, MO")]: { lat: "39.0852981", lng: "-94.5796375" },
  [normalizeAddress("1727 McGee St, Kansas City, MO")]: { lat: "39.0923242", lng: "-94.5797777" },
  [normalizeAddress("2405 Grand Blvd, Kansas City, MO")]: { lat: "39.0833027", lng: "-94.5814386" },
  [normalizeAddress("2301 Holmes St, Kansas City, MO")]: { lat: "39.0845711", lng: "-94.5752264" },
  [normalizeAddress("2101 Charlotte St, Kansas City, MO")]: { lat: "39.0869", lng: "-94.5745" },
  [normalizeAddress("10 E 13th St, Kansas City, MO")]: { lat: "39.0987093", lng: "-94.5830685" },
  [normalizeAddress("2 Memorial Dr, Kansas City, MO")]: { lat: "39.0806754", lng: "-94.5860757" },
  [normalizeAddress("1 Memorial Dr, Kansas City, MO")]: { lat: "39.0751944", lng: "-94.5862079" },
  [normalizeAddress("1725 McGee St, Kansas City, MO")]: { lat: "39.0924047", lng: "-94.5797743" },
  [normalizeAddress("1733 Locust St, Kansas City, MO")]: { lat: "39.0920624", lng: "-94.5774614" },
  [normalizeAddress("1740 Holmes St, Kansas City, MO")]: { lat: "39.0918436", lng: "-94.5757887" },
  [normalizeAddress("1809 Grand Blvd, Kansas City, MO")]: { lat: "39.0913444", lng: "-94.5809785" },
  [normalizeAddress("1830 Walnut St, Kansas City, MO")]: { lat: "39.0912818", lng: "-94.5826133" }
};

function shouldSuggestRideshare(place) {
  const text = `${place.category} ${place.meta} ${place.description}`.toLowerCase();
  if (/rideshare|late-night|jazz lounge|cocktail lounge|supper club|nightlife|spirits/.test(text)) return true;
  const miles = text.match(/(\d+(?:\.\d+)?)\s*miles?/);
  if (miles && Number(miles[1]) > 1) return true;
  const minutes = text.match(/(\d+)[-\s]*minute walk/);
  if (minutes && Number(minutes[1]) > 20) return true;
  return false;
}

function toggleRideshareOptions(index) {
  const card = els.placeGrid.querySelector(`[data-place-card="${index}"]`);
  if (!card) return;
  const options = card.querySelector(".rideshare-options");
  const button = card.querySelector("[data-place-rideshare]");
  if (!options || !button) return;
  const opening = options.hidden;
  els.placeGrid.querySelectorAll(".rideshare-options").forEach((node) => {
    node.hidden = true;
  });
  els.placeGrid.querySelectorAll("[data-place-rideshare]").forEach((node) => {
    node.setAttribute("aria-expanded", "false");
  });
  options.hidden = !opening;
  button.setAttribute("aria-expanded", String(opening));
}

function openWalkingDirections(index) {
  const place = state.guide.nearby[index];
  if (!place) return;
  const mapWindow = window.open(walkingDirectionsUrl(place), "_blank");
  if (mapWindow) mapWindow.opener = null;
  if (!mapWindow) window.location.href = walkingDirectionsUrl(place);
}

function persistSaved() {
  localStorage.setItem("nehaSaved", JSON.stringify(state.saved));
  queueScheduleSync();
}

function pruneSaved() {
  const valid = new Set(state.sessions.map((session) => session.id));
  ["watch", "attend"].forEach((kind) => {
    Object.keys(state.saved[kind] || {}).forEach((id) => {
      if (!valid.has(id)) delete state.saved[kind][id];
    });
  });
  persistSaved();
}

function updateSavedCounts() {
  els.watchCount.textContent = `${Object.keys(state.saved.watch).length} watching`;
  els.attendCount.textContent = `${Object.keys(state.saved.attend).length} attending`;
}

function getAttending() {
  return state.sessions.filter((session) => state.saved.attend[session.id]);
}

function getWatching() {
  return state.sessions.filter((session) => state.saved.watch[session.id]);
}

function getSavedSessions() {
  return [...getAttending(), ...getWatching()]
    .filter((session, index, list) => list.findIndex((item) => item.id === session.id) === index);
}

function conflictCount(sessions) {
  let conflicts = 0;
  const byDay = Map.groupBy ? Map.groupBy(sessions, (session) => session.date) : groupByDate(sessions);
  byDay.forEach((items) => {
    const sorted = [...items].sort(sortSessions);
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].start < sorted[i - 1].end) conflicts += 1;
    }
  });
  return conflicts;
}

function groupByDate(items) {
  const map = new Map();
  items.forEach((item) => {
    if (!map.has(item.date)) map.set(item.date, []);
    map.get(item.date).push(item);
  });
  return map;
}

function matchesQuery(session, query) {
  if (!query) return true;
  return `${session.title} ${session.location} ${session.category} ${session.tags.join(" ")} ${session.info}`.toLowerCase().includes(query);
}

function metricHtml(items) {
  return items.map(([value, label]) => `<div class="metric"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join("");
}

function sumCe(sessions) {
  return sessions.reduce((sum, session) => sum + (Number(session.ce) || 0), 0).toFixed(1).replace(".0", "");
}

function sortSessions(a, b) {
  return a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title);
}

function sessionStartDate(session) {
  return new Date(`${session.date}T${session.start}:00`);
}

function sessionEndDate(session) {
  return new Date(`${session.date}T${session.end}:00`);
}

function dayLabel(day) {
  return day === "all" ? "All days" : dayFormatter.format(new Date(`${day}T12:00:00`));
}

function formatDate(day) {
  return dayFormatter.format(new Date(`${day}T12:00:00`));
}

function shortTime(value) {
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

function communityCategoryLabel(id) {
  return communityCategories.find((category) => category.id === id)?.label || "Community";
}

function relativePostTime(value) {
  const date = new Date(value);
  if (isNaN(date)) return "just now";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function safeImageUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    const driveId = driveFileIdFromUrl(url);
    if (driveId) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w1200`;
    return url.href;
  } catch (error) {
    return "";
  }
}

function driveFileIdFromUrl(url) {
  if (url.hostname !== "drive.google.com") return "";
  const queryId = url.searchParams.get("id");
  if (queryId) return queryId;
  const match = url.pathname.match(/\/file\/d\/([^/]+)/);
  return match ? match[1] : "";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function brandCopy(value) {
  return String(value || "").replace(/HS\s*Cloud\s*Suite|HSCloud Suite|HSCLOUD SUITE/gi, "HS CloudSuite");
}
