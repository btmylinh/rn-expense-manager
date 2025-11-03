// navigators/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tabs from './Tabs';
import AuthNavigator from './AuthNavigator';
import BudgetCreateScreen from '../screens/budgets/BudgetCreateScreen';
import BudgetDetailScreen from '../screens/budgets/BudgetDetailScreen';
import BudgetHistoryScreen from '../screens/budgets/BudgetHistoryScreen';
import TransactionListScreen from '../screens/transactions/TransactionListScreen';

export type RootStackParamList = {
	Auth: undefined;
	Tabs: { initialTab?: string } | undefined;
	BudgetCreate: {
		categories: any[];
		budget: any;
		editMode: boolean;
	};
	BudgetDetail: {
		budgetId: number;
		readOnly?: boolean;
	};
	BudgetHistory: undefined;
	TransactionList: {
		budgetId: number;
	};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
	return (
		<NavigationContainer>
			<SafeAreaView style={{ flex: 1 }} edges={["top"]}>
				<Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
					<Stack.Screen name="Auth" component={AuthNavigator} />
					<Stack.Screen name="Tabs" component={Tabs} />
					<Stack.Screen name="BudgetCreate" component={BudgetCreateScreen} />
					<Stack.Screen name="BudgetDetail" component={BudgetDetailScreen} />
					<Stack.Screen name="BudgetHistory" component={BudgetHistoryScreen} />
					<Stack.Screen name="TransactionList" component={TransactionListScreen} />
				</Stack.Navigator>
			</SafeAreaView>
		</NavigationContainer>
	);
}
