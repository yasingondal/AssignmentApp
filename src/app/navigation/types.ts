export type ConsultationStackParamList = {
  DoctorList: undefined;
  DoctorDetail: { doctorId: string };
  BookingConfirm: { doctorId: string; slotId: string };
  UpcomingConsultations: undefined;
  BookingDetail: { bookingId: string };
};

export type ShopStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  Wishlist: undefined;
};

export type HealthStackParamList = {
  HealthTimeline: undefined;
  HealthRecordDetail: { recordId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type MainTabParamList = {
  ConsultationTab: undefined;
  ShopTab: undefined;
  HealthTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
