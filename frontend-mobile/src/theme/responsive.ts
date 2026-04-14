import { useWindowDimensions } from "react-native";

export const breakpoints = {
  compact: 390,
  tablet: 768,
};

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isCompact = width < breakpoints.compact;
  const isTablet = width >= breakpoints.tablet;
  const contentMaxWidth = isTablet ? 760 : 560;

  return {
    width,
    isCompact,
    isTablet,
    contentMaxWidth,
  };
}

