import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TrendingUp, List, Settings as SettingsIcon, Plus, Wallet } from 'lucide-react-native';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountsScreen } from '../screens/AccountsScreen';
import { MoneyScreen } from '../screens/MoneyScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type RootTabParamList = {
  Accounts: undefined;
  Money: undefined;
  AddTransaction: undefined;
  Transactions: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICON_COLOR_ACTIVE = '#374151';
const ICON_COLOR_INACTIVE = '#9ca3af';
const ICON_COLOR_ACTIVE_DARK = '#d1d5db';

export const AppNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          elevation: 0,
        },
        tabBarActiveTintColor: ICON_COLOR_ACTIVE,
        tabBarInactiveTintColor: ICON_COLOR_INACTIVE,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{
          title: '収支',
          tabBarIcon: ({ focused }) => (
            <TrendingUp size={22} color={focused ? ICON_COLOR_ACTIVE : ICON_COLOR_INACTIVE} />
          ),
        }}
      />
      <Tab.Screen
        name="Money"
        component={MoneyScreen}
        options={{
          title: 'お金',
          tabBarIcon: ({ focused }) => (
            <Wallet size={22} color={focused ? ICON_COLOR_ACTIVE : ICON_COLOR_INACTIVE} />
          ),
        }}
      />
      <Tab.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <TouchableOpacity
              onPress={props.onPress as () => void}
              accessibilityRole="button"
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#374151',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Plus size={22} color="#ffffff" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          title: '履歴',
          tabBarIcon: ({ focused }) => (
            <List size={22} color={focused ? ICON_COLOR_ACTIVE : ICON_COLOR_INACTIVE} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '設定',
          tabBarIcon: ({ focused }) => (
            <SettingsIcon size={22} color={focused ? ICON_COLOR_ACTIVE : ICON_COLOR_INACTIVE} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
