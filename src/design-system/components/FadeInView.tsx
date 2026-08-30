import React, { useEffect, useRef } from 'react';
import { Animated, type ViewProps } from 'react-native';

interface FadeInViewProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  slideUp?: boolean;
}

export function FadeInView({
  children,
  delay = 0,
  duration = 400,
  slideUp = true,
  style,
  ...props
}: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideUp ? 12 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View
      style={[style, { opacity, transform: [{ translateY }] }]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}
