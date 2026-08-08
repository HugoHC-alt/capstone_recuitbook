import type {
  AcademicBackground,
  ProfileAchievement,
  ProfileActivity,
  StudentProfile,
} from '@/lib/student-profile/types';

export interface StudentProfileCompletionSection {
  id: string;
  label: string;
  complete: boolean;
}

export interface StudentProfileCompletion {
  sections: StudentProfileCompletionSection[];
  completedSections: number;
  totalSections: number;
  percentComplete: number;
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function calculateStudentProfileCompletion(input: {
  profile: StudentProfile | null;
  academicBackgrounds: AcademicBackground[];
  activities: ProfileActivity[];
  achievements: ProfileAchievement[];
}): StudentProfileCompletion {
  const { profile, academicBackgrounds, activities, achievements } = input;

  const basicInfoComplete =
    profile !== null && hasText(profile.preferred_name) && hasText(profile.country);

  const narrativesComplete =
    profile !== null &&
    (hasText(profile.narrative_background) ||
      hasText(profile.narrative_goals) ||
      hasText(profile.narrative_activities_summary));

  const sections: StudentProfileCompletionSection[] = [
    { id: 'basicInfo', label: 'Basic info', complete: basicInfoComplete },
    {
      id: 'academicBackground',
      label: 'Academic background',
      complete: academicBackgrounds.length >= 1,
    },
    { id: 'activities', label: 'Activities', complete: activities.length >= 1 },
    {
      id: 'achievements',
      label: 'Achievements',
      complete: achievements.length >= 1,
    },
    { id: 'narratives', label: 'Narratives', complete: narrativesComplete },
  ];

  const totalSections = sections.length;
  const completedSections = sections.filter((section) => section.complete).length;
  const percentComplete =
    totalSections === 0
      ? 0
      : Math.round((completedSections / totalSections) * 100);

  return { sections, completedSections, totalSections, percentComplete };
}
