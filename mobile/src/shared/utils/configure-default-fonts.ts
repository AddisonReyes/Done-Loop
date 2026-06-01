import {
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

import { Fonts } from '@/constants/theme';

type ComponentWithDefaultProps<Props> = {
  defaultProps?: Partial<Props>;
};

export function configureDefaultFonts() {
  const textComponent = Text as typeof Text & ComponentWithDefaultProps<TextProps>;
  const textInputComponent = TextInput as typeof TextInput & ComponentWithDefaultProps<TextInputProps>;

  textComponent.defaultProps = {
    ...textComponent.defaultProps,
    style: [{ fontFamily: Fonts.sans }, textComponent.defaultProps?.style],
  };

  textInputComponent.defaultProps = {
    ...textInputComponent.defaultProps,
    style: [{ fontFamily: Fonts.sans }, textInputComponent.defaultProps?.style],
  };
}
