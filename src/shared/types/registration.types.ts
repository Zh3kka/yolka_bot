export enum ParticipationStatus {
  GOING = 'Пойду',
  WITH_GUEST = 'С гостем',
  WITH_CHILD = 'С ребёнком',
  DECLINED = 'Отказ',
}

export interface ChildData {
  name: string;
  age: number;
  hasPerformance: boolean;
  performanceDescription?: string;
  giftWishes?: string;
}

export interface RegistrationData {
  timestamp: string;
  telegramId: number;
  username: string;
  fullName: string;
  status: ParticipationStatus;
  guestsCount?: number;
  guestsNames?: string[];
  childrenCount?: number;
  childrenData?: ChildData[];
  childhoodPhotoUrl?: string;
  currentPhotoUrl?: string;
}

