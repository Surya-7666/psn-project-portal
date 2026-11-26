const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const Guide = require('../models/Guide');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

dotenv.config();

const rawDataset = [
  // 1. DR. M. VARGHEESE (1 - 5)
  { sno: 1, name: 'ABDUL ASHIK K', projectTitle: 'AI POWERED HEALTHCARE SIMULATION CGM & INTELLIGENT EMERGENCY RESPONSE SYSTEM', guideName: 'DR. M. VARGHEESE' },
  { sno: 2, name: 'GOKILA M', projectTitle: 'SMART GEO SENSOR BASED LANDSLIDE MONITORING AND PREDICTION SYSTEM', guideName: 'DR. M. VARGHEESE' },
  { sno: 3, name: 'MARISELVAM S', projectTitle: 'AI BASED G-MAIL GATE ENTRY MONITORING', guideName: 'DR. M. VARGHEESE' },
  { sno: 4, name: 'RAJESH KUMAR T', projectTitle: 'SMART PARKING MANAGEMENT SYSTEM USING IOT', guideName: 'DR. M. VARGHEESE' },
  { sno: 5, name: 'THANGAMATHI S', projectTitle: 'AI BASED PHISHING DETECTION SYSTEM', guideName: 'DR. M. VARGHEESE' },

  // 2. DR. V. JOSEPHINE SUTHA (6 - 11)
  { sno: 6, name: 'AKSHAYA G', projectTitle: 'AI BASED PHISHING WEBSITE DETECTION AND CYBER THREAT ANALYSIS SYSTEM', guideName: 'DR. V. JOSEPHINE SUTHA' },
  { sno: 7, name: 'ASHWINRAJ M', projectTitle: 'STUDENT NOTES & STUDY MATERIAL SHARING PORTAL', guideName: 'DR. V. JOSEPHINE SUTHA' },
  { sno: 8, name: 'KALIDASS G', projectTitle: 'DESIGN & DEVELOPMENT OF A WEB BASED STUDENT ASSIGNMENT & DEADLINE MANAGEMENT SYSTEM', guideName: 'DR. V. JOSEPHINE SUTHA' },
  { sno: 9, name: 'MURUGA VALLI S', projectTitle: 'ADAPTIVE SECURITY GATEWAY FOR AI AGENT', guideName: 'DR. V. JOSEPHINE SUTHA' },
  { sno: 10, name: 'PARAMASIVAN A', projectTitle: 'ROLEFIT - AN AI RESUME BUILDER', guideName: 'DR. V. JOSEPHINE SUTHA' },
  { sno: 11, name: 'BENEDICT PROMILTAN J', projectTitle: 'SPAM EMAIL DETECTION SYSTEM', guideName: 'DR. V. JOSEPHINE SUTHA' },

  // 3. MRS. J. YAMUNA BEE (12 - 17)
  { sno: 12, name: 'ANISHKUMAR I', projectTitle: 'NEUROFOCUS: AN INTELLIGENT AI AGENT FOR ADAPTIVE DIGITAL WELLBEING & BEHAVIOUR OPTIMIZATION', guideName: 'MRS. J. YAMUNA BEE' },
  { sno: 13, name: 'BAVITHA K', projectTitle: 'ARRHYTHMIA DETECTION FOR HEALTH CARE MONITORING USING MACHINE LEARNING', guideName: 'MRS. J. YAMUNA BEE' },
  { sno: 14, name: 'DINESHKUMAR A', projectTitle: 'AI POWERED COLLEGE ENQUIRY CHATBOT', guideName: 'MRS. J. YAMUNA BEE' },
  { sno: 15, name: 'NAVEENKUMAR J', projectTitle: 'SMART CROP DISEASES DETECTION SYSTEM', guideName: 'MRS. J. YAMUNA BEE' },
  { sno: 16, name: 'RAJALAKSHMI P', projectTitle: 'AI AND SENSOR BASED AUTOMATIC BIODEGRADABLE & NON-BIO WASTE IDENTIFICATION AND SEGREGATION SYSTEM USING IOT', guideName: 'MRS. J. YAMUNA BEE' },
  { sno: 17, name: 'LIMISHINA NOWRIN S', projectTitle: 'ABSENT FOR ZEROTH REVIEW', guideName: 'MRS. J. YAMUNA BEE' },

  // 4. DR. D. KIRUBA JOTHI (18 - 23)
  { sno: 18, name: 'AMITHESH GK', projectTitle: 'PROVENANCE-AWARE GUARD AGAINST INDIRECT PROMPT INJECTION IN LLM AGENTS', guideName: 'DR. D. KIRUBA JOTHI' },
  { sno: 19, name: 'ESAISELVI S', projectTitle: 'A MULTI PROVIDER EMERGENCY AMBULANCE ALLOCATION F/W USING VARIATIONAL DEEP EMBEDDING AND PROBABILISTIC CLUSTERING', guideName: 'DR. D. KIRUBA JOTHI' },
  { sno: 20, name: 'KARTHIKEYAN M', projectTitle: 'ONLINE COMPLAINT MANAGEMENT SYSTEM', guideName: 'DR. D. KIRUBA JOTHI' },
  { sno: 21, name: 'RAJA B', projectTitle: 'CLOUD BASED FILE STORAGE SYSTEMS', guideName: 'DR. D. KIRUBA JOTHI' },
  { sno: 22, name: 'VIGNESHKUMAR B', projectTitle: 'CLOUD SMART STUDENT ATTENDANCE MANAGEMENT SYSTEM', guideName: 'DR. D. KIRUBA JOTHI' },
  { sno: 23, name: 'MADHAVAN S', projectTitle: 'AI BASED WORKER SAFETY MONITORING SYSTEM', guideName: 'DR. D. KIRUBA JOTHI' },

  // 5. DR. S. MUTHUKUMAR (24 - 29)
  { sno: 24, name: 'ANTONY DHARSHINI K', projectTitle: 'AI-POWERED RESUME SKILL GAP ANALYZER AND CAREER RECOMMENDATION SYSTEM', guideName: 'DR. S. MUTHUKUMAR' },
  { sno: 25, name: 'HARI THARUN M', projectTitle: 'FAKE NEWS DETECTION USING MACHINE LEARNING', guideName: 'DR. S. MUTHUKUMAR' },
  { sno: 26, name: 'MOHAMED RAFEEK A', projectTitle: 'AI POWERED SMART HOSPITAL MANAGEMENT AND INTELLIGENT PATIENT ANALYSIS SYSTEM', guideName: 'DR. S. MUTHUKUMAR' },
  { sno: 27, name: 'PRIYASAKTHI M', projectTitle: 'SATDATA - QUANTUM SAFE AND BLOCKCHAIN BASED SECURE SATELLITE COMM. WITH INTELLIGENT ATTACK DETECTION', guideName: 'DR. S. MUTHUKUMAR' },
  { sno: 28, name: 'SIVASANKAR N', projectTitle: 'AI POWERED CAREER GUIDANCE AND JOB ASSISTANT SYSTEM USING AI AGENT', guideName: 'DR. S. MUTHUKUMAR' },
  { sno: 29, name: 'SARAN V', projectTitle: 'AI CUSTOMER SUPPORT CHATBOT (24X7) ASSISTANCE', guideName: 'DR. S. MUTHUKUMAR' },

  // 6. MR. D. JOSEPH PUSHPARAJ (30 - 35)
  { sno: 30, name: 'ANANTHA DHARSHINI B', projectTitle: 'MEDICAL REPORT SIMPLIFIER USING PRIVACY-PRESERVING & NLP', guideName: 'MR. D. JOSEPH PUSHPARAJ' },
  { sno: 31, name: 'BELBIN GLANT JS', projectTitle: 'STUDENT PLACEMENT DATA ANALYSIS', guideName: 'MR. D. JOSEPH PUSHPARAJ' },
  { sno: 32, name: 'MAHESWARAN M', projectTitle: 'ONLINE EXAM RESULT PREDICTION SYSTEM', guideName: 'MR. D. JOSEPH PUSHPARAJ' },
  { sno: 33, name: 'NITHISHKUMAR J', projectTitle: 'STUDENT ACADEMIC PERFORMANCE PREDICTION SYSTEM', guideName: 'MR. D. JOSEPH PUSHPARAJ' },
  { sno: 34, name: 'RAMYA S', projectTitle: 'INTELLIGENT PHISHING DETECTION AND THREAT ANALYSIS SYSTEM', guideName: 'MR. D. JOSEPH PUSHPARAJ' },
  { sno: 35, name: 'SUDHARSAN V', projectTitle: 'AN AUTOMATED MULTI-TENANT CLOUD PROVISIONING ENGINE', guideName: 'MR. D. JOSEPH PUSHPARAJ' },

  // 7. MR. G. SIVAKUMAR (36 - 41)
  { sno: 36, name: 'DEEPA T', projectTitle: 'AI BASED IMAGE FORGERY DETECTION AND VERIFICATION SYSTEM', guideName: 'MR. G. SIVAKUMAR' },
  { sno: 37, name: 'ESAKKIRAJA M', projectTitle: 'AI BASED SCAM CALL AND FAKE VOICE DETECTION SYSTEM', guideName: 'MR. G. SIVAKUMAR' },
  { sno: 38, name: 'KAVI SUGENDHAR K', projectTitle: 'SMART TRAVEL BOOKING AND MANAGEMENT SYSTEM', guideName: 'MR. G. SIVAKUMAR' },
  { sno: 39, name: 'PRAVEEN V', projectTitle: 'GEN-AI POWERED INTELLIGENT LOG CLASSIFICATION SYSTEM USING REGEX, BERT & DEEPSEEK R1', guideName: 'MR. G. SIVAKUMAR' },
  { sno: 40, name: 'THAMARAISASI S', projectTitle: 'INTELLIGENT LAB REMINDER & NOTIFICATION SYSTEM', guideName: 'MR. G. SIVAKUMAR' },
  { sno: 41, name: 'KAVIN M', projectTitle: "STUDENTS' ACADEMIC MANAGEMENT SYSTEM", guideName: 'MR. G. SIVAKUMAR' },

  // 8. MRS. A. ENITHA (42 - 47)
  { sno: 42, name: 'ANURADHA M', projectTitle: 'SUSPICIOUS WEBSITE DETECTION SYSTEM', guideName: 'MRS. A. ENITHA' },
  { sno: 43, name: 'CHRISTOBER M', projectTitle: 'A MULTIMODAL DL BASED SYS FOR DETECTING AI GENERATED ITPDF', guideName: 'MRS. A. ENITHA' },
  { sno: 44, name: 'KALIRAJA M', projectTitle: 'E-WASTE MANAGEMENT AND RECYCLING TRACKING SYSTEM', guideName: 'MRS. A. ENITHA' },
  { sno: 45, name: 'SARANYA S', projectTitle: 'CLOUD BASED ONLINE EXAMINATION & RESULT MANAGEMENT SYSTEM', guideName: 'MRS. A. ENITHA' },
  { sno: 46, name: 'VINOTH KUMAR S', projectTitle: 'AI POWERED SMART EVENT AND CELEBRATION PLANNER', guideName: 'MRS. A. ENITHA' },
  { sno: 47, name: 'SIVASEKAR E', projectTitle: 'SMART APPOINTMENT & SERVICE BOOKING PLATFORM', guideName: 'MRS. A. ENITHA' },

  // 9. MR. N. PONNITHISH (48 - 53)
  { sno: 48, name: 'INDHUMATHI S', projectTitle: 'PLANT STRESS EARLY WARNING SYSTEM USING IMAGE PROCESSING', guideName: 'MR. N. PONNITHISH' },
  { sno: 49, name: 'KALLANDA PERUMAL S', projectTitle: 'FLEET MANAGEMENT SYSTEM', guideName: 'MR. N. PONNITHISH' },
  { sno: 50, name: 'MURUGAN M', projectTitle: 'AI-ENHANCED DEPENDENCY GRAPH BASED SBOM GEN AND EXPLAINABLE VULNERABILITY RISK PRIORITIZATION SYSTEM', guideName: 'MR. N. PONNITHISH' },
  { sno: 51, name: 'SRIDEVI N', projectTitle: 'STUDENT DROPOUT RISK PREDICTION SYSTEM', guideName: 'MR. N. PONNITHISH' },
  { sno: 52, name: 'UDHAYAKUMAR K', projectTitle: 'INTELLIGENT IDENTITY RISK DETECTION SYSTEM', guideName: 'MR. N. PONNITHISH' },
  { sno: 53, name: 'VENGADA KRISHNAN P', projectTitle: 'AGENT DEALER MANAGEMENT SYSTEM', guideName: 'MR. N. PONNITHISH' },

  // 10. MRS. S. VALARMATHI (54 - 59)
  { sno: 54, name: 'JONES J', projectTitle: 'REACT UI LIBRARY USING AI AGENTS', guideName: 'MRS. S. VALARMATHI' },
  { sno: 55, name: 'MATHUMITHA G', projectTitle: 'GLOBAL ENERGY CONSUMPTION PATTERNS ANALYSIS', guideName: 'MRS. S. VALARMATHI' },
  { sno: 56, name: 'MUTHUVEL P', projectTitle: 'AI SCAM SHIELD PREDICTION SYSTEM', guideName: 'MRS. S. VALARMATHI' },
  { sno: 57, name: 'RAJADURAI R', projectTitle: 'GENERATIVE AI BASED FINANCIAL RESEARCH & ANALYSIS SYSTEM', guideName: 'MRS. S. VALARMATHI' },
  { sno: 58, name: 'SAKTHIMARI V', projectTitle: 'AGRISAGE: AI BASED SMART CROP YIELD PREDICTION AND IRRIGATION OPTIMIZATION', guideName: 'MRS. S. VALARMATHI' },
  { sno: 59, name: 'VIPINKUMAR D', projectTitle: 'QR CODE-BASED PHISHING DETECTION SYSTEM', guideName: 'MRS. S. VALARMATHI' },

  // 11. MS. V. AATHEESHWARI (60 - 65)
  { sno: 60, name: 'KALIESWARI P', projectTitle: 'CREDIT CARD FRAUD DETECTION USING MACHINE LEARNING', guideName: 'MS. V. AATHEESHWARI' },
  { sno: 61, name: 'MAHARAJOTHI M', projectTitle: 'SMART AGRICULTURE DATA ANALYTICS USING PYTHON', guideName: 'MS. V. AATHEESHWARI' },
  { sno: 62, name: 'MUNEESWARI M', projectTitle: 'ABSENT FOR ZEROTH REVIEW', guideName: 'MS. V. AATHEESHWARI' },
  { sno: 63, name: 'PANDEESWARI M', projectTitle: 'ABSENT FOR ZEROTH REVIEW', guideName: 'MS. V. AATHEESHWARI' },
  { sno: 64, name: 'SURYA PERUMAL JEYAPANDI P', projectTitle: 'AI AUTOMATION PLATFORMS WITH AI AGENTS', guideName: 'MS. V. AATHEESHWARI' },
  { sno: 65, name: 'JOHN BRITTO I', projectTitle: 'ABSENT FOR ZEROTH REVIEW', guideName: 'MS. V. AATHEESHWARI' },

  // 12. MR. GEORGE JOSEPH EDISON (66 - 71)
  { sno: 66, name: 'KAUTHAM BARATH H', projectTitle: 'AI POWERED SMART CLASSROOM ATTENDANCE & FACE RECOGNITION SYSTEM', guideName: 'MR. GEORGE JOSEPH EDISON' },
  { sno: 67, name: 'MOHANA LAKSHMI A', projectTitle: 'AI POWERED PERSONALIZED LEARNING AND CAREER GUIDANCE SYSTEM', guideName: 'MR. GEORGE JOSEPH EDISON' },
  { sno: 68, name: 'MUTHUVEL S', projectTitle: 'STUDENT PERFORMANCE & PREDICTION SYSTEM', guideName: 'MR. GEORGE JOSEPH EDISON' },
  { sno: 69, name: 'PREM SHANKAR RAI S', projectTitle: 'AI POWERED CLOUD FILE MANAGEMENT SYSTEM WITH INTELLIGENT DOCUMENT ASSISTANT', guideName: 'MR. GEORGE JOSEPH EDISON' },
  { sno: 70, name: 'SHARON G J', projectTitle: 'DOCKER SECURE SANDBOX FOR AI AGENT', guideName: 'MR. GEORGE JOSEPH EDISON' },
  { sno: 71, name: 'SURESH M', projectTitle: 'FINAL YEAR PROJECT MANAGEMENT SYSTEM', guideName: 'MR. GEORGE JOSEPH EDISON' },

  // 13. MRS. V. KOWSALYA (72 - 77)
  { sno: 72, name: 'KIRUTHIKA SK', projectTitle: 'MEDICAL TRANSFORMER DRIVEN RETRIEVAL AUGMENTED GENERATION FOR FACTUAL RADIOLOGY REPORT GENERATION', guideName: 'MRS. V. KOWSALYA' },
  { sno: 73, name: 'NATARAJAN A', projectTitle: 'YOLO BASED CLASSROOM OBJECT-INVENTORY MONITORING WITH REFERENCE-AWARE MISSING OBJECT DETECTION', guideName: 'MRS. V. KOWSALYA' },
  { sno: 74, name: 'PRAVEEN KUMAR C', projectTitle: 'MULTISCALE VISUAL FEATURE FUSION USING CNN AND ATTENTION FOR SCREENSHOT BASED PHISHING WEBSITE DETECTION', guideName: 'MRS. V. KOWSALYA' },
  { sno: 75, name: 'JENISH A', projectTitle: 'OPERATION AWARE 3D DATA STRUCTURE VISUALIZATION WITH ALGORITHM COMPLEXITY FEEDBACK', guideName: 'MRS. V. KOWSALYA' },
  { sno: 76, name: 'SURESH C', projectTitle: 'ADAPTIVE RETRIEVAL-AUGMENTED GENERATION WITH BLOOMS TAXONOMY BASED QUESTIONS DIFFICULTY OPTIMIZATION FOR PERSONALIZED DETECTION', guideName: 'MRS. V. KOWSALYA' },
  { sno: 77, name: 'MEENA M', projectTitle: 'ABSENT FOR ZEROTH REVIEW', guideName: 'MRS. V. KOWSALYA' },
];

const importData = async () => {
  try {
    await connectDB();

    await Attendance.deleteMany();
    await Student.deleteMany();
    await Guide.deleteMany();
    await Admin.deleteMany();

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@psncet.ac.in').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'psncet2026';

    await Admin.create({
      name: 'HOD & Class Advisor (CSE)',
      email: adminEmail,
      password: adminPassword,
    });

    const uniqueGuidesMap = new Map();
    rawDataset.forEach((item) => {
      if (!uniqueGuidesMap.has(item.guideName)) {
        uniqueGuidesMap.set(item.guideName, {
          name: item.guideName,
          designation: '',
        });
      }
    });

    const createdGuides = await Guide.insertMany(Array.from(uniqueGuidesMap.values()));
    const guideLookup = {};
    createdGuides.forEach((g) => {
      guideLookup[g.name] = g._id;
    });

    const studentDocs = rawDataset.map((item) => ({
      sno: item.sno,
      name: item.name,
      projectTitle: item.projectTitle,
      guideId: guideLookup[item.guideName],
    }));

    await Student.insertMany(studentDocs);

    console.log(`Seeded 1 Admin (${adminEmail}), ${createdGuides.length} Guides, and ${studentDocs.length} Students successfully!`);
    process.exit();
  } catch (error) {
    console.error(`Seed Error: ${error.message}`);
    process.exit(1);
  }
};

importData();