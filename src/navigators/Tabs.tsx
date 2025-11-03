// navigators/Tabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AddTransactionScreen from '../screens/transactions/AddTransactionScreen';
import BudgetsScreen from '../screens/budgets/BudgetsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';

const Tab = createBottomTabNavigator();

export default function Tabs({ route }: any) {
	const theme = useAppTheme();
	const insets = useSafeAreaInsets();
	const initialTab = route?.params?.initialTab || 'Tổng quan';
	
	return (
		<Tab.Navigator
			initialRouteName={initialTab}
			screenOptions={({ route }) => ({
				headerShown: false,
				tabBarHideOnKeyboard: true,
				tabBarIcon: ({ color, size }) => {
					let name: any = 'home';
					if (route.name === 'Tổng quan') name = 'view-dashboard-outline';
					else if (route.name === 'Ngân sách') name = 'cash-multiple';
					else if (route.name === 'Thêm') name = 'plus-circle';
					else if (route.name === 'Sổ giao dịch') name = 'book-account';
					else if (route.name === 'Hồ sơ') name = 'account';
					const iconColor = color;
					const iconSize = size;
					return <MaterialCommunityIcons name={name} size={iconSize} color={iconColor} />;
				},
				tabBarActiveTintColor: theme.colors.primary,
				tabBarStyle: { height: Math.max(60, 56 + insets.bottom), paddingTop: 6, paddingBottom: Math.max(8, insets.bottom) },
				tabBarLabelStyle: { fontSize: 12 },
			})}
		>
			<Tab.Screen name="Tổng quan" component={DashboardScreen} />
			<Tab.Screen name="Ngân sách" component={BudgetsScreen} />
			<Tab.Screen name="Thêm" component={AddTransactionScreen} />
			<Tab.Screen name="Sổ giao dịch" component={TransactionsScreen} />
			<Tab.Screen name="Hồ sơ" component={ProfileScreen} />
		</Tab.Navigator>
	);
}
