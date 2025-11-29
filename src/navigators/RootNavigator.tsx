// navigators/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tabs from './Tabs';
import AuthNavigator from './AuthNavigator';
import { useAuth } from '../contexts/AuthContext';
import BudgetCreateScreen from '../screens/budgets/BudgetCreateScreen';
import BudgetDetailScreen from '../screens/budgets/BudgetDetailScreen';
import BudgetHistoryScreen from '../screens/budgets/BudgetHistoryScreen';
import BudgetsScreen from '../screens/budgets/BudgetsScreen';
import TransactionListScreen from '../screens/transactions/TransactionListScreen';
import NotificationScreen from '../screens/notifications/NotificationScreen';
import StreakDetailScreen from '../screens/streak/StreakDetailScreen';
import StreakSettingsScreen from '../screens/streak/StreakSettingsScreen';
import SavingsGoalCreateScreen from '../screens/savings/SavingsGoalCreateScreen';
import SavingsGoalDetailScreen from '../screens/savings/SavingsGoalDetailScreen';
import SavingsGoalsScreen from '../screens/savings/SavingsGoalsScreen';
import ChatbotScreen from '../screens/tools/ChatbotScreen';
import RecurringExpensesScreen from '../screens/recurring/RecurringExpensesScreen';
import ReportExportScreen from '../screens/reports/ReportExportScreen';
import AfterRegisterSetupScreen from '../screens/setup/AfterRegisterSetupScreen';

export type RootStackParamList = {
	Auth: undefined;
	Setup: undefined;
	Tabs: { initialTab?: string } | undefined;
	Tools: undefined;
	Budgets: undefined;
	SavingsGoals: undefined;
	Chatbot: undefined;
	RecurringExpenses: undefined;
	ReportExport: undefined;
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
	Notifications: undefined;
	StreakDetail: undefined;
	StreakSettings: undefined;
	SavingsGoalCreate: {
		goalId?: number;
	};
	SavingsGoalDetail: {
		goalId: number;
	};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
	const { user } = useAuth();

	return (
		<NavigationContainer>
			<SafeAreaView style={{ flex: 1 }} edges={["top"]}>
				<Stack.Navigator screenOptions={{ headerShown: false }}>
					{user ? (
						<>
					<Stack.Screen name="Setup" component={AfterRegisterSetupScreen} />
					<Stack.Screen name="Tabs" component={Tabs} />
					<Stack.Screen name="Budgets" component={BudgetsScreen} />
					<Stack.Screen name="SavingsGoals" component={SavingsGoalsScreen} />
					<Stack.Screen name="RecurringExpenses" component={RecurringExpensesScreen} />
					<Stack.Screen name="ReportExport" component={ReportExportScreen} />
					<Stack.Screen name="BudgetCreate" component={BudgetCreateScreen} />
					<Stack.Screen name="BudgetDetail" component={BudgetDetailScreen} />
					<Stack.Screen name="BudgetHistory" component={BudgetHistoryScreen} />
					<Stack.Screen name="TransactionList" component={TransactionListScreen} />
							<Stack.Screen name="Notifications" component={NotificationScreen} />
							<Stack.Screen name="StreakDetail" component={StreakDetailScreen} />
							<Stack.Screen name="StreakSettings" component={StreakSettingsScreen} />
							<Stack.Screen name="SavingsGoalCreate" component={SavingsGoalCreateScreen} />
						<Stack.Screen name="SavingsGoalDetail" component={SavingsGoalDetailScreen} />
						<Stack.Screen name="Chatbot" component={ChatbotScreen} />
						</>
					) : (
						<Stack.Screen name="Auth" component={AuthNavigator} />
					)}
				</Stack.Navigator>
			</SafeAreaView>
		</NavigationContainer>
	);
}
