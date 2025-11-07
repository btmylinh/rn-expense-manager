import React from 'react';
import { StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useAppTheme } from '../theme';

interface RightIcon {
  name: string;
  onPress: () => void;
  iconColor?: string;
}

interface AppBarProps {
  title?: string;
  onBack?: () => void;
  rightIcons?: RightIcon[];
  align?: 'center' | 'left' | 'between';
  backgroundColor?: string;
  backIconColor?: string;
}

export default function AppBar({
  title,
  onBack,
  rightIcons = [],
  align = 'center',
  backgroundColor,
  backIconColor,
}: AppBarProps) {
  const theme = useAppTheme();

  const appBarStyle = {
    backgroundColor: backgroundColor || theme.colors.surface,
    height: 48,
    paddingHorizontal: 2, // Giảm padding ngang để icons gần nhau hơn
  };

  const titleStyle = {
    fontSize: 18, 
    fontWeight: '600' as const,
  };

  // Style để giảm khoảng cách giữa các icon
  const actionStyle = (index: number) => ({
    marginLeft: index > 0 ? -8 : 0, // Giảm khoảng cách giữa các icon
  });

  // Render based on alignment
  if (align === 'between') {
    return (
      <Appbar.Header style={appBarStyle} statusBarHeight={0}>
        {/* Left side */}
        {onBack && (
          <Appbar.BackAction 
            onPress={onBack} 
            iconColor={backIconColor || theme.colors.onSurface}
            size={20} 
          />
        )}
        
        {/* Center content */}
        <Appbar.Content 
          title={title || ''} 
          titleStyle={{ ...titleStyle, textAlign: 'center' }}
        />
        
        {/* Right side */}
        {rightIcons.map((icon, index) => (
          <Appbar.Action
            key={index}
            icon={icon.name}
            onPress={icon.onPress}
            iconColor={icon.iconColor || theme.colors.onSurface}
            size={18}
            style={actionStyle(index)}
          />
        ))}
      </Appbar.Header>
    );
  }

  if (align === 'center') {
    return (
      <Appbar.Header style={appBarStyle} statusBarHeight={0}>
        {onBack && (
          <Appbar.BackAction 
            onPress={onBack} 
            iconColor={backIconColor || theme.colors.onSurface}
            size={24} 
          />
        )}
        
        <Appbar.Content 
          title={title || ''} 
          titleStyle={{ 
            ...titleStyle,
            textAlign: 'center',
            marginLeft: onBack ? -40 : 0, 
            marginRight: rightIcons.length > 0 ? -40 * rightIcons.length : 0, 
          }}
        />
        
        {rightIcons.map((icon, index) => (
          <Appbar.Action
            key={index}
            icon={icon.name}
            onPress={icon.onPress}
            iconColor={icon.iconColor || theme.colors.onSurface}
            size={20}
            style={actionStyle(index)}
          />
        ))}
      </Appbar.Header>
    );
  }

  // Default: left alignment
  return (
    <Appbar.Header style={appBarStyle} statusBarHeight={0}>
      {onBack && (
        <Appbar.BackAction 
          onPress={onBack} 
          iconColor={backIconColor || theme.colors.onSurface}
          size={20} 
        />
      )}
      
      <Appbar.Content 
        title={title || ''} 
        titleStyle={titleStyle}
      />
      
      {rightIcons.map((icon, index) => (
        <Appbar.Action
          key={index}
          icon={icon.name}
          onPress={icon.onPress}
          iconColor={icon.iconColor || theme.colors.onSurface}
          size={20}
          style={actionStyle(index)}
        />
      ))}
    </Appbar.Header>
  );
}