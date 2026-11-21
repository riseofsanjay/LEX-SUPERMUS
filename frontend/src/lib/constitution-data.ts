export const CONSTITUTION_PREAMBLE =
  "WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens: JUSTICE, social, economic and political; LIBERTY of thought, expression, belief, faith and worship; EQUALITY of status and of opportunity; and to promote among them all FRATERNITY assuring the dignity of the individual and the unity and integrity of the Nation; IN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION.";

export const CONSTITUTION_SCHEDULES = [
  { number: 1, title: "Territories of the States and Union territories" },
  { number: 2, title: "Emoluments and allowances" },
  { number: 3, title: "Forms of oaths and affirmations" },
  { number: 4, title: "Allocation of seats in the Council of States" },
  { number: 5, title: "Administration and control of Scheduled Areas and Scheduled Tribes" },
  { number: 6, title: "Administration of tribal areas in Assam, Meghalaya, Tripura and Mizoram" },
  { number: 7, title: "Union, State and Concurrent Legislative Lists" },
  { number: 8, title: "Languages recognised in the Constitution" },
  { number: 9, title: "Acts and Regulations protected from judicial review" },
  { number: 10, title: "Provisions concerning disqualification on grounds of defection" },
  { number: 11, title: "Powers and responsibilities of Panchayats" },
  { number: 12, title: "Powers and responsibilities of Municipalities" },
];

export const CONSTITUTION_ARTICLES = Array.from({ length: 395 }, (_, index) => index + 1);

export const CONSTITUTION_PARTS = [
  { part: "I", title: "The Union and its Territory", range: "Articles 1 to 4", start: 1, end: 4, chapters: [] },
  { part: "II", title: "Citizenship", range: "Articles 5 to 11", start: 5, end: 11, chapters: [] },
  { part: "III", title: "Fundamental Rights", range: "Articles 12 to 35", start: 12, end: 35, chapters: [
    { title: "General", range: "Articles 12 to 13", start: 12, end: 13 },
    { title: "Right to Equality", range: "Articles 14 to 18", start: 14, end: 18 },
    { title: "Right to Freedom", range: "Articles 19 to 22", start: 19, end: 22 },
    { title: "Right against Exploitation", range: "Articles 23 to 24", start: 23, end: 24 },
    { title: "Freedom of Religion", range: "Articles 25 to 28", start: 25, end: 28 },
    { title: "Cultural and Educational Rights", range: "Articles 29 to 30", start: 29, end: 30 },
    { title: "Right to Constitutional Remedies", range: "Articles 32 to 35", start: 32, end: 35 },
  ] },
  { part: "IV", title: "Directive Principles of State Policy", range: "Articles 36 to 51", start: 36, end: 51, chapters: [] },
  { part: "IV-A", title: "Fundamental Duties", range: "Article 51A", start: 51, end: 51, chapters: [] },
  { part: "V", title: "The Union", range: "Articles 52 to 151", start: 52, end: 151, chapters: [
    { title: "The Executive", range: "Articles 52 to 78", start: 52, end: 78 },
    { title: "Parliament", range: "Articles 79 to 122", start: 79, end: 122 },
    { title: "Legislative Powers of the President", range: "Article 123", start: 123, end: 123 },
    { title: "The Union Judiciary", range: "Articles 124 to 147", start: 124, end: 147 },
    { title: "Comptroller and Auditor-General", range: "Articles 148 to 151", start: 148, end: 151 },
  ] },
  { part: "VI", title: "The States", range: "Articles 152 to 237", start: 152, end: 237, chapters: [
    { title: "General", range: "Article 152", start: 152, end: 152 },
    { title: "The Executive", range: "Articles 153 to 167", start: 153, end: 167 },
    { title: "The State Legislature", range: "Articles 168 to 212", start: 168, end: 212 },
    { title: "Legislative Powers of the Governor", range: "Article 213", start: 213, end: 213 },
    { title: "The High Courts", range: "Articles 214 to 231", start: 214, end: 231 },
    { title: "Subordinate Courts", range: "Articles 233 to 237", start: 233, end: 237 },
  ] },
  { part: "VIII", title: "The Union Territories", range: "Articles 239 to 242", start: 239, end: 242, chapters: [] },
  { part: "IX", title: "The Panchayats", range: "Articles 243 to 243O", start: 243, end: 243, chapters: [] },
  { part: "IX-A", title: "The Municipalities", range: "Articles 243P to 243ZG", start: 243, end: 243, chapters: [] },
  { part: "IX-B", title: "Co-operative Societies", range: "Articles 243ZH to 243ZT", start: 243, end: 243, chapters: [] },
  { part: "X", title: "The Scheduled and Tribal Areas", range: "Articles 244 to 244A", start: 244, end: 244, chapters: [] },
  { part: "XI", title: "Relations between the Union and the States", range: "Articles 245 to 293", start: 245, end: 293, chapters: [] },
  { part: "XII", title: "Finance, Property, Contracts and Suits", range: "Articles 264 to 300A", start: 264, end: 300, chapters: [] },
  { part: "XIII", title: "Trade, Commerce and Intercourse within the Territory of India", range: "Articles 301 to 307", start: 301, end: 307, chapters: [] },
  { part: "XIV", title: "Services under the Union and the States", range: "Articles 308 to 323", start: 308, end: 323, chapters: [
    { title: "Services", range: "Articles 309 to 311", start: 309, end: 311 },
    { title: "Public Service Commissions", range: "Articles 315 to 323", start: 315, end: 323 },
  ] },
  { part: "XIV-A", title: "Tribunals", range: "Articles 323A to 323B", start: 323, end: 323, chapters: [] },
  { part: "XV", title: "Elections", range: "Articles 324 to 329A", start: 324, end: 329, chapters: [] },
  { part: "XVI", title: "Special Provisions relating to Certain Classes", range: "Articles 330 to 342A", start: 330, end: 342, chapters: [] },
  { part: "XVII", title: "Official Language", range: "Articles 343 to 351", start: 343, end: 351, chapters: [
    { title: "Language of the Union", range: "Articles 343 to 344", start: 343, end: 344 },
    { title: "Regional Languages", range: "Articles 345 to 347", start: 345, end: 347 },
    { title: "Language of the Supreme Court and High Courts", range: "Articles 348 to 349", start: 348, end: 349 },
    { title: "Special Directives", range: "Articles 350 to 351", start: 350, end: 351 },
  ] },
  { part: "XVIII", title: "Emergency Provisions", range: "Articles 352 to 360", start: 352, end: 360, chapters: [] },
  { part: "XIX", title: "Miscellaneous", range: "Articles 361 to 367", start: 361, end: 367, chapters: [] },
  { part: "XX", title: "Amendment of the Constitution", range: "Article 368", start: 368, end: 368, chapters: [] },
  { part: "XXI", title: "Temporary, Transitional and Special Provisions", range: "Articles 369 to 392", start: 369, end: 392, chapters: [] },
  { part: "XXII", title: "Short title, Commencement, Hindi Text and Repeals", range: "Articles 393 to 395", start: 393, end: 395, chapters: [] },
];

export const CONSTITUTION_AMENDMENTS = Array.from({ length: 106 }, (_, index) => {
  const number = index + 1;
  const notableNames: Record<number, string> = {
    1: "Restrictions on freedom of speech; special provisions",
    7: "Reorganisation of States",
    9: "Validation of certain land reforms",
    14: "Inclusion of Dadra and Nagar Haveli",
    24: "Parliamentary power to amend the Constitution",
    25: "Property and Article 31",
    42: "Minerva Mills era reforms; Socialist, Secular and Integrity",
    44: "Rights and emergency safeguards",
    52: "Defection-related disqualification",
    61: "Voting age reduced from 21 to 18",
    73: "Panchayats",
    74: "Municipalities",
    86: "Education as a fundamental right",
    91: "Council of Ministers size",
    97: "Co-operative societies",
    101: "Reservation of seats for Scheduled Tribes",
    102: "Goods and Services Tax",
    103: "Economic reservation for EWS",
    105: "Union Territory of Jammu and Kashmir reorganisation",
    106: "Reservation of seats for women",
  };
  return { number, topic: notableNames[number] ?? "" };
});

export const CONSTITUTION_LANDMARK_CASES = [
  { name: "Kesavananda Bharati v. State of Kerala", articles: "Article 368", topic: "Basic Structure", source: "https://www.sci.gov.in/judgements/" },
  { name: "Maneka Gandhi v. Union of India", articles: "Articles 14, 19 and 21", topic: "Procedure established by law; personal liberty", source: "https://www.sci.gov.in/judgements/" },
  { name: "A. K. Gopalan v. State of Madras", articles: "Articles 19 and 21", topic: "Personal liberty", source: "https://www.sci.gov.in/judgements/" },
  { name: "I. R. Coelho v. State of Tamil Nadu", articles: "Articles 14, 32 and 368", topic: "Basic Structure and Ninth Schedule", source: "https://www.sci.gov.in/judgements/" },
  { name: "Indira Nehru Gandhi v. Raj Narain", articles: "Article 329A and Article 368", topic: "Basic Structure; free and fair elections", source: "https://www.sci.gov.in/judgements/" },
  { name: "Minerva Mills v. Union of India", articles: "Articles 14, 19, 21 and 368", topic: "Balance of Fundamental Rights and Directive Principles", source: "https://www.sci.gov.in/judgements/" },
  { name: "S. R. Bommai v. Union of India", articles: "Articles 356 and 355", topic: "Federalism; President's Rule", source: "https://www.sci.gov.in/judgements/" },
  { name: "K. S. Puttaswamy v. Union of India", articles: "Articles 14, 21 and 19", topic: "Right to privacy", source: "https://www.sci.gov.in/judgements/" },
  { name: "Navtej Singh Johar v. Union of India", articles: "Articles 14, 15, 19 and 21", topic: "LGBTQ+ rights; privacy and dignity", source: "https://www.sci.gov.in/judgements/" },
  { name: "N. N. Vishaka v. State of Rajasthan", articles: "Articles 14, 15, 19 and 21", topic: "Workplace sexual harassment", source: "https://www.sci.gov.in/judgements/" },
  { name: "Bachpan Bachao Andolan v. Union of India", articles: "Articles 21 and 23", topic: "Child labour and bonded labour", source: "https://www.sci.gov.in/judgements/" },
  { name: "Hussainara Khatoon v. State of Bihar", articles: "Articles 21 and 39A", topic: "Speedy trial and legal aid", source: "https://www.sci.gov.in/judgements/" },
  { name: "Olga Tellis v. Bombay Municipal Corporation", articles: "Articles 21 and 39A", topic: "Livelihood and due process", source: "https://www.sci.gov.in/judgements/" },
  { name: "Mohini Jain v. State of Karnataka", articles: "Articles 14 and 21", topic: "Right to education", source: "https://www.sci.gov.in/judgements/" },
  { name: "Unnikrishnan J. P. v. State of Andhra Pradesh", articles: "Articles 21 and 45", topic: "Right to education", source: "https://www.sci.gov.in/judgements/" },
  { name: "Kuldip Nayar v. Union of India", articles: "Articles 80 and 81", topic: "Rajya Sabha and representation", source: "https://www.sci.gov.in/judgements/" },
  { name: "Lily Thomas v. Union of India", articles: "Article 102", topic: "Disqualification and defection", source: "https://www.sci.gov.in/judgements/" },
  { name: "Public Union for Civil Liberties v. Union of India", articles: "Articles 19 and 21", topic: "Right to information and hunger", source: "https://www.sci.gov.in/judgements/" },
];
