import { useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

export const AnimatedTabView = ({ children }: { children: React.ReactNode }) => {
    const isFocused = useIsFocused();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.98);

    useEffect(() => {
        if (isFocused) {
            opacity.value = withTiming(1, { duration: 250 });
            scale.value = withTiming(1, { duration: 250 });
        } else {
            opacity.value = withTiming(0, { duration: 200 });
            scale.value = withTiming(0.98, { duration: 200 });
        }
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle((): ViewStyle => {
        return {
            opacity: opacity.value,
            transform: [{ scale: scale.value }],
        };
    });

    return <Animated.View style={[{ flex: 1 }, animatedStyle]}>{children}</Animated.View>;
};
