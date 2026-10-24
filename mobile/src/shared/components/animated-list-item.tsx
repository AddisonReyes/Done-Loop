import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { useDecorativeAnimations } from '@/shared/hooks/use-decorative-animations';

type AnimatedListItemProps = PropsWithChildren<{
  animate?: boolean;
  delay?: number;
}>;

export function AnimatedListItem({ animate = true, children, delay = 0 }: AnimatedListItemProps) {
  const animationsEnabled = useDecorativeAnimations();
  const shouldAnimate = animationsEnabled && animate;
  if (!shouldAnimate) return <View>{children}</View>;

  return (
    <Animated.View
      entering={shouldAnimate ? FadeInUp.duration(180).delay(delay) : undefined}
      exiting={shouldAnimate ? FadeOutUp.duration(140) : undefined}
      layout={shouldAnimate ? LinearTransition.duration(180) : undefined}>
      {children}
    </Animated.View>
  );
}
