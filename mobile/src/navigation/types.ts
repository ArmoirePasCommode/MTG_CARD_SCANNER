import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NewCard } from '../types/api';

export type RootStackParamList = {
  AppTabs: undefined;
  CardDetails: { card: NewCard; fromScan?: boolean };
  BulkScan: undefined;
  AddCards: undefined;
  Auth: undefined;
};

export type AppTabsParamList = {
  Home: undefined;
  Scan: undefined;
  Profile: undefined;
};

export type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;
export type CardDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'CardDetails'>;
export type BulkScanScreenProps = NativeStackScreenProps<RootStackParamList, 'BulkScan'>;
export type AddCardsScreenProps = NativeStackScreenProps<RootStackParamList, 'AddCards'>;
export type HomeScreenProps = BottomTabScreenProps<AppTabsParamList, 'Home'>;
export type ScanScreenProps = BottomTabScreenProps<AppTabsParamList, 'Scan'>;
export type ProfileScreenProps = BottomTabScreenProps<AppTabsParamList, 'Profile'>;
