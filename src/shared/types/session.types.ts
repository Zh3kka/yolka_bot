import { ParticipationStatus, ChildData } from './registration.types';

export enum SessionStep {
  IDLE = 'IDLE',
  AWAITING_NAME = 'AWAITING_NAME',
  AWAITING_GUESTS_COUNT = 'AWAITING_GUESTS_COUNT',
  AWAITING_GUEST_NAME = 'AWAITING_GUEST_NAME',
  AWAITING_CHILDREN_COUNT = 'AWAITING_CHILDREN_COUNT',
  AWAITING_CHILD_NAME = 'AWAITING_CHILD_NAME',
  AWAITING_CHILD_AGE = 'AWAITING_CHILD_AGE',
  AWAITING_PERFORMANCE_CHOICE = 'AWAITING_PERFORMANCE_CHOICE',
  AWAITING_PERFORMANCE_DESCRIPTION = 'AWAITING_PERFORMANCE_DESCRIPTION',
  AWAITING_GIFT_WISHES = 'AWAITING_GIFT_WISHES',
  AWAITING_CHILDHOOD_PHOTO = 'AWAITING_CHILDHOOD_PHOTO',
  AWAITING_CURRENT_PHOTO = 'AWAITING_CURRENT_PHOTO',
  COMPLETED = 'COMPLETED',
}

export interface UserSession {
  telegramId: number;
  username: string;
  step: SessionStep;
  status?: ParticipationStatus;
  fullName?: string;
  guestsCount?: number;
  guestsNames: string[];
  currentGuestIndex: number;
  childrenCount?: number;
  childrenData: ChildData[];
  currentChildIndex: number;
  currentChildName?: string;
  currentChildAge?: number;
  childhoodPhotoUrl?: string;
  currentPhotoUrl?: string;
}

export const createEmptySession = (
  telegramId: number,
  username: string,
): UserSession => ({
  telegramId,
  username,
  step: SessionStep.IDLE,
  guestsNames: [],
  currentGuestIndex: 0,
  childrenData: [],
  currentChildIndex: 0,
});

