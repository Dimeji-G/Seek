import { create } from "zustand";
import { User, ProfilePayload } from "@/services/auth.service";

export interface SignupState extends Partial<ProfilePayload> {
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Password: string;
  ConfirmPassword: string;
  currentStep: number;
  userId?: string;
  profileId?: string;
}

interface AuthStore {
  user: User | null;
  signupData: SignupState;
  setUser: (user: User | null) => void;
  updateSignupData: (data: Partial<SignupState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetSignup: () => void;
}

const STEPS = [
  "signup",
  "biodata",
  "diet-type",
  "allergies",
  "user-goals",
] as const;

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  signupData: {
    FirstName: "",
    LastName: "",
    Email: "",
    PhoneNumber: "",
    Password: "",
    ConfirmPassword: "",
    currentStep: 0,
    dateOfBirth: "",
    gender: "",
    height: 0,
    weight: 0,
    skinType: "",
    nationality: "",
    dietType: "",
    allergies: [],
    userGoals: [],
  },
  setUser: (user) => set({ user }),
  updateSignupData: (data) =>
    set((state) => ({
      signupData: { ...state.signupData, ...data },
    })),
  nextStep: () =>
    set((state) => {
      const currentStep = state.signupData.currentStep || 0;
      return {
        signupData: {
          ...state.signupData,
          currentStep: Math.min(currentStep + 1, STEPS.length - 1),
        },
      };
    }),
  prevStep: () =>
    set((state) => {
      const currentStep = state.signupData.currentStep || 1;
      return {
        signupData: {
          ...state.signupData,
          currentStep: Math.max(currentStep - 1, 0),
        },
      };
    }),
  resetSignup: () =>
    set({
      signupData: {
        FirstName: "",
        LastName: "",
        Email: "",
        PhoneNumber: "",
        Password: "",
        ConfirmPassword: "",
        currentStep: 0,
        dateOfBirth: "",
        gender: "",
        height: 0,
        weight: 0,
        skinType: "",
        nationality: "",
        dietType: "",
        allergies: [],
        userGoals: [],
      },
    }),
}));

export default useAuthStore;
