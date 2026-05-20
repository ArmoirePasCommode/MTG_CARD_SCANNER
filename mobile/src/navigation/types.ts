import type { CompositeScreenProps } from '@react-navigation/native';
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
export type ProfileScreenProps = BottomTabScreenProps<AppTabsParamList, 'Profile'>;

// Tab screens that also push to the root stack need CompositeScreenProps so
// their navigation prop can reach both the tab navigator and the stack navigator.
export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<AppTabsParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;
export type ScanScreenProps = CompositeScreenProps<
  BottomTabScreenProps<AppTabsParamList, 'Scan'>,
  NativeStackScreenProps<RootStackParamList>
>;
