import { Text, View } from 'react-native';

type Props = { family: string; variant: number; size: number; inverse?: boolean };
export default function WordmarkSpecimen({ family, variant, size, inverse = false }: Props) {
  const color = inverse ? '#000000' : '#FFFFFF';
  const text = { fontFamily: family, fontSize: size, lineHeight: size * 1.3, color, includeFontPadding: false };
  return <View accessible accessibilityLabel={`NEXT, period treatment ${variant + 1}`} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'baseline' }}>
    {variant === 0 ? <Text allowFontScaling={false} style={text}>NEXT.</Text> : <>
      <Text allowFontScaling={false} style={[text, { letterSpacing: -size * 0.025 }]}>NEXT</Text>
      {variant === 1 ? <Text allowFontScaling={false} style={[text, { fontSize: size * 0.85, marginLeft: size * 0.04 }]}>.</Text> :
        <View style={{ width: size * 0.13, height: size * 0.13, borderRadius: size, backgroundColor: color, marginLeft: size * 0.08, transform: [{ translateY: -size * 0.015 }] }} />}
    </>}
  </View>;
}
