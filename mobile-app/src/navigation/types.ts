import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type AppTabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList> | undefined;
  Attendance: undefined;
  Leave: { activeTab?: 'my_leaves' | 'approvals'; openApplyModal?: boolean } | undefined;
  DocumentHub: undefined;
  HRConnect: { activeTab?: 'feed' | 'groups' | 'chats' } | undefined;
  ProfileStack: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Directory: NavigatorScreenParams<DirectoryStackParamList> | undefined;
  DigitalVault: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  Directory: NavigatorScreenParams<DirectoryStackParamList> | undefined;
  DigitalVault: undefined;
  HRCommandCenter: undefined;
  ExitDetail: { exitId: string };
  PerformanceDetail: { reviewId: string };
  OnboardingDetail: { candidateId: string };
  ProbationReview: { probationId: string };
};

export type DirectoryStackParamList = {
  DirectoryList: undefined;
  EmployeeDetail: { employeeId: string };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppTabParamList>;
};
