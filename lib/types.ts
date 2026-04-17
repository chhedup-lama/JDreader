export interface WorkExperienceData {
  id?: number;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  tags: string[];
  order?: number;
}

export interface SkillData {
  id?: number;
  category: string;
  items: string[];
}

export interface LeadershipStoryData {
  id?: number;
  title: string;
  situation: string;
  action: string;
  result: string;
  tags: string[];
}

export interface MasterProfileData {
  shortTitle: string;
  coverLetterInstructions: string;
  workExperiences: WorkExperienceData[];
  skills: SkillData[];
  leadershipStories: LeadershipStoryData[];
}

export interface ExtractedFeatures {
  company: string;
  role: string;
  requiredSkills: string[];
  preferredSkills: string[];
  yearsOfExperience: string;
  domainContext: string;
  atsKeywords: string[];
  responsibilities: string[];
}

export interface ATSReport {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  weakSections: string[];
  suggestions: string[];
}

export interface CVExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface GenerationResult {
  cvTitle: string;
  cvExperiences: CVExperience[];
  cvSkills: SkillData[];
  coverLetter: string;
  atsScore: number;        // before: original profile vs JD
  atsReport: ATSReport;   // before
  afterAtsScore: number;  // after: tailored CV vs JD
  afterAtsReport: ATSReport;
  hrEmail: string;
  linkedinMessage: string;
}

export interface GenerationOptions {
  coverLetter: boolean;
  hrEmail: boolean;
  linkedinMessage: boolean;
}
