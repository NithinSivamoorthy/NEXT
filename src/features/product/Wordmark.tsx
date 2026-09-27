import { Text, View } from 'react-native';
/** The period is geometry, never a glyph. Equal dimensions and half-radius on every platform. */
export function Wordmark({size=27}:{size?:number}){
 const diameter=size*.13;
 return <View accessible accessibilityLabel="NEXT" style={{flexDirection:'row',alignItems:'baseline'}}>
  <Text allowFontScaling={false} style={{fontFamily:'Contact-Clash',fontSize:size,lineHeight:size*1.2,letterSpacing:-size*.025,color:'#f4f0e9'}}>NEXT</Text>
  <View style={{width:diameter,height:diameter,borderRadius:diameter/2,overflow:'hidden',backgroundColor:'#f4f0e9',marginLeft:size*.08,alignSelf:'flex-end',marginBottom:size*.3}}/>
 </View>;
}
