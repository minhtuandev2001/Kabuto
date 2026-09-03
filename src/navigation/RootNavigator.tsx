import { Ionicons } from '@expo/vector-icons';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { MiniPlayer } from '../components/MiniPlayer';
import { usePlayer } from '../context/PlayerContext';
import { LessonListScreen } from '../screens/LessonListScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WordListScreen } from '../screens/WordListScreen';
import { colors, font, glass } from '../theme';
import type { LessonsStackParamList, MainTabParamList, RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const LessonsStack = createNativeStackNavigator<LessonsStackParamList>();

function LessonsNavigator({
  onPlayLesson,
}: {
  onPlayLesson: (lesson: number, index?: number) => void;
}) {
  const { lessonId, index, isPlaying } = usePlayer();

  return (
    <LessonsStack.Navigator screenOptions={{ headerShown: false }}>
      <LessonsStack.Screen name="LessonList">
        {({ navigation }) => (
          <LessonListScreen
            onOpenLesson={(lesson) => navigation.navigate('WordList', { lesson })}
            onPlayLesson={(lesson) => onPlayLesson(lesson, 0)}
          />
        )}
      </LessonsStack.Screen>
      <LessonsStack.Screen name="WordList">
        {({ navigation, route }) => (
          <WordListScreen
            lesson={route.params.lesson}
            currentIndex={index}
            currentLessonId={lessonId}
            isPlaying={isPlaying}
            onBack={() => navigation.goBack()}
            onPlayAll={() => onPlayLesson(route.params.lesson, 0)}
            onPlayWord={(wordIndex) => onPlayLesson(route.params.lesson, wordIndex)}
          />
        )}
      </LessonsStack.Screen>
    </LessonsStack.Navigator>
  );
}

function MainTabs() {
  const { playLesson, lessonId, currentWord } = usePlayer();

  return (
    <Tab.Navigator
      tabBar={(props) => {
        const activeRoute = props.state.routes[props.state.index]?.name;
        const showMini = activeRoute !== 'Player' && Boolean(currentWord);
        return (
          <View>
            {showMini && (
              <MiniPlayer
                visible={showMini}
                onOpenPlayer={() => props.navigation.navigate('Player')}
              />
            )}
            <BottomTabBar {...props} />
          </View>
        );
      }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: font.bold,
          fontSize: 11.5,
          marginBottom: 6,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={40}
              tint="light"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, styles.tabTint]} />
          </View>
        ),
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 70,
          paddingTop: 8,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen
        name="Player"
        options={{
          title: 'Nghe',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'headset' : 'headset-outline'} size={24} color={color} />
          ),
        }}
      >
        {({ navigation }) => (
          <PlayerScreen
            onOpenQueue={() =>
              navigation.navigate('Lessons', {
                screen: 'WordList',
                params: { lesson: lessonId },
              })
            }
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Lessons"
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Lessons', { screen: 'LessonList' });
          },
        })}
        options={{
          title: 'Bài học',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
          ),
        }}
      >
        {({ navigation }) => (
          <LessonsNavigator
            onPlayLesson={(lesson, wordIndex = 0) => {
              playLesson(lesson, wordIndex);
              navigation.navigate('Player');
            }}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { playLesson } = usePlayer();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <RootStack.Screen name="Welcome">
          {({ navigation }) => (
            <WelcomeScreen
              onStart={() => {
                playLesson(1, 0);
                navigation.replace('Main');
              }}
            />
          )}
        </RootStack.Screen>
        <RootStack.Screen name="Main" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabTint: {
    backgroundColor: glass.fillStrong,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
});
