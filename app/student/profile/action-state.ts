export interface ProfileActionState {
  error: string | null;
  success: string | null;
}

export const INITIAL_PROFILE_ACTION_STATE: ProfileActionState = {
  error: null,
  success: null,
};
