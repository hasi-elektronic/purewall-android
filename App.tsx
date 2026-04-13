import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen     from './src/screens/HomeScreen';
import FiltersScreen  from './src/screens/FiltersScreen';
import StatsScreen    from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

const PurewallTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card:       colors.s1,
    border:     colors.border,
    text:       colors.text,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <NavigationContainer theme={PurewallTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color }) => {
              const icons: Record<string, [string, string]> = {
                Home:     ['shield',      'shield-outline'],
                Filters:  ['list',        'list-outline'],
                Stats:    ['bar-chart',   'bar-chart-outline'],
                Settings: ['settings',    'settings-outline'],
              };
              const [active, inactive] = icons[route.name] || ['circle', 'circle-outline'];
              return <Ionicons name={(focused ? active : inactive) as any} size={22} color={color} />;
            },
            tabBarActiveTintColor:   colors.accent,
            tabBarInactiveTintColor: colors.muted,
            tabBarStyle: {
              backgroundColor: colors.s1,
              borderTopColor:  colors.border,
              borderTopWidth:  1,
              height: 60,
              paddingBottom: 8,
            },
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
            headerStyle: {
              backgroundColor: colors.s1,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            },
            headerTintColor: colors.text,
            headerLeft: () => (
              <View style={styles.headerLogo}>
                <View style={styles.shieldIcon}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
                </View>
                <Text style={styles.headerBrand}>purewall</Text>
              </View>
            ),
            headerTitle: () => null,
          })}
        >
          <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarLabel: 'Protection' }} />
          <Tab.Screen name="Filters"  component={FiltersScreen}  options={{ tabBarLabel: 'Filters' }} />
          <Tab.Screen name="Stats"    component={StatsScreen}    options={{ tabBarLabel: 'Stats' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
  },
  shieldIcon: {
    width: 30, height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(14,165,233,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
});
