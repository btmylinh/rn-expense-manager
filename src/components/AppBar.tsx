// components/AppBar.tsx
import React from 'react';
import { Appbar } from 'react-native-paper';

export default function AppBar({ title }: { title: string }) {
	return (
		<Appbar.Header>
			<Appbar.Content title={title} />
		</Appbar.Header>
	);
}
