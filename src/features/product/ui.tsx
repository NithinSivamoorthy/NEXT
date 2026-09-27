import { useFonts } from 'expo-font';
import { Pressable, StyleSheet, Text, View } from 'react-native';
export function useProductFonts(){return useFonts({
  'Contact-Clash':require('../../../assets/dev/typography/ClashDisplay-Bold.otf'),
  'Contact-Inter':require('../../../assets/dev/typography/Inter-Regular.otf'),
  'Contact-Space':require('../../../assets/dev/typography/SpaceGrotesk-Bold.otf'),
});}
type ActionProps={label:string;onPress:()=>void;disabled?:boolean;variant?:'primary'|'secondary'|'tertiary'|'danger';support?:string;photo?:boolean;reducedMotion?:boolean};
export function Action({label,onPress,disabled=false,variant='tertiary',support,photo=false,reducedMotion=true}:ActionProps){
 const contained=variant==='primary'||variant==='secondary';
 if(!contained&&!photo&&!support)return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[ui.button,{opacity:disabled?.35:pressed?.6:1}]}><Text style={[ui.label,variant==='danger'&&{color:'#c58b91'}]}>{label}</Text></Pressable>;
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={support} accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
  style={({pressed})=>[ui.button,contained&&actions.surface,variant==='primary'&&actions.primary,variant==='secondary'&&actions.secondary,
   {opacity:disabled?.38:1,transform:[{scale:pressed&&!reducedMotion?.985:1}]},pressed&&{backgroundColor:contained?'#24213e':'#10111a',borderColor:'#b4b1f2',shadowRadius:6}]}>
  <View style={{flexDirection:'row',alignItems:'center',gap:14}}>
   {photo&&<View accessibilityElementsHidden style={actions.camera}><View style={actions.lens}/></View>}
   <View style={{flex:1}}><Text style={[ui.label,variant==='danger'&&{color:'#c58b91'}]}>{label}</Text>{support&&<Text style={actions.support}>{support}</Text>}</View>
  </View>
 </Pressable>;
}
const actions=StyleSheet.create({
 surface:{paddingHorizontal:18,borderRadius:18,borderWidth:1,marginVertical:7,shadowOffset:{width:0,height:0}},
 primary:{backgroundColor:'#191a35',borderColor:'#767ac2',shadowColor:'#7d79ee',shadowOpacity:.25,shadowRadius:10},
 secondary:{backgroundColor:'#0e111e',borderColor:'#414760'},
 support:{fontFamily:'Contact-Inter',fontSize:14,lineHeight:21,color:'#b8bbd2',marginTop:5},
 camera:{width:25,height:20,borderWidth:1.5,borderColor:'#c5c4ed',borderRadius:5,alignItems:'center',justifyContent:'center'},
 lens:{width:9,height:9,borderWidth:1.5,borderColor:'#c5c4ed',borderRadius:5},
});
export const ui=StyleSheet.create({
 screen:{flex:1,backgroundColor:'#000'},body:{fontFamily:'Contact-Inter',color:'#c4c9d0',fontSize:17,lineHeight:26},
 title:{fontFamily:'Contact-Clash',color:'#f4f0e9',fontSize:30,lineHeight:36,marginBottom:18},
 label:{fontFamily:'Contact-Space',fontSize:13,letterSpacing:1.1,color:'#eee7d8'},
 eyebrow:{fontFamily:'Contact-Space',fontSize:11,letterSpacing:1.8,color:'#929ca8',marginBottom:20},
 button:{minHeight:52,paddingVertical:16,justifyContent:'center'},
 input:{fontFamily:'Contact-Inter',color:'#f4f0e9',fontSize:18,lineHeight:27,minHeight:90,maxHeight:180,borderBottomWidth:1,borderBottomColor:'#4b5058',paddingVertical:12,marginVertical:12,textAlignVertical:'top'},
});
