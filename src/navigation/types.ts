import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Welcome: undefined;
  Main: undefined;
};

export type LessonsStackParamList = {
  LessonList: undefined;
  WordList: { lesson: number };
};

export type MainTabParamList = {
  Player: undefined;
  Lessons: NavigatorScreenParams<LessonsStackParamList> | undefined;
  Settings: undefined;
};
