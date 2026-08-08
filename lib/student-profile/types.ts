import type { StudentProfileCompletion } from '@/lib/student-profile/completion';

export interface StudentProfile {
  id: string;
  application_user_id: string;
  preferred_name: string | null;
  country: string | null;
  city_region: string | null;
  intended_major: string | null;
  narrative_background: string | null;
  narrative_goals: string | null;
  narrative_activities_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface AcademicBackground {
  id: string;
  student_profile_id: string;
  school_name: string;
  country: string | null;
  curriculum: string | null;
  graduation_year: number | null;
  academic_summary: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileActivity {
  id: string;
  student_profile_id: string;
  title: string;
  organization: string | null;
  description: string | null;
  start_year: number | null;
  end_year: number | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileAchievement {
  id: string;
  student_profile_id: string;
  title: string;
  issuer: string | null;
  description: string | null;
  received_year: number | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface StudentProfileInsert {
  preferred_name?: string | null;
  country?: string | null;
  city_region?: string | null;
  intended_major?: string | null;
  narrative_background?: string | null;
  narrative_goals?: string | null;
  narrative_activities_summary?: string | null;
}

export type StudentProfileUpdate = Partial<StudentProfileInsert>;

export interface AcademicBackgroundInsert {
  student_profile_id: string;
  school_name: string;
  country?: string | null;
  curriculum?: string | null;
  graduation_year?: number | null;
  academic_summary?: string | null;
  position?: number;
}

export type AcademicBackgroundUpdate = Partial<
  Omit<AcademicBackgroundInsert, 'student_profile_id'>
>;

export interface ProfileActivityInsert {
  student_profile_id: string;
  title: string;
  organization?: string | null;
  description?: string | null;
  start_year?: number | null;
  end_year?: number | null;
  position?: number;
}

export type ProfileActivityUpdate = Partial<
  Omit<ProfileActivityInsert, 'student_profile_id'>
>;

export interface ProfileAchievementInsert {
  student_profile_id: string;
  title: string;
  issuer?: string | null;
  description?: string | null;
  received_year?: number | null;
  position?: number;
}

export type ProfileAchievementUpdate = Partial<
  Omit<ProfileAchievementInsert, 'student_profile_id'>
>;

export interface StudentProfileAggregate {
  profile: StudentProfile | null;
  academicBackgrounds: AcademicBackground[];
  activities: ProfileActivity[];
  achievements: ProfileAchievement[];
  completion: StudentProfileCompletion;
}
