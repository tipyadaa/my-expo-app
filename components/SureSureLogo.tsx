import * as React from "react";
import {
  Image,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ImageStyle,
} from "react-native";

const logoSource: ImageSourcePropType = require("../assets/sure-sure-logo.png");

type Props = {
  style?: StyleProp<ImageStyle>;
  /**
   * Optional accessibility label override.
   * Defaults to "Sure Sure" to describe the brand mark.
   */
  accessibilityLabel?: string;
};

export default function SureSureLogo({
  style,
  accessibilityLabel = "Sure Sure",
}: Props) {
  return (
    <Image
      source={logoSource}
      style={[styles.logo, style]}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 120,
    height: 120,
  },
});
