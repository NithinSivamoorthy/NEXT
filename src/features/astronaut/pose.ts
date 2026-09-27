import { Box3, FrontSide, Group, MeshStandardMaterial, Quaternion, Vector3, type Bone, type SkinnedMesh } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

/** One-time preparation. Shared source geometry/textures are never mutated or disposed. */
export function createAstronautInstance(source:Group) {
  const root = clone(source);
  root.updateMatrixWorld(true);
  const point = new Vector3(), origin = new Vector3(), world = new Quaternion(), parent = new Quaternion();
  const aim = (name:string, childName:string, direction:[number,number,number]) => {
    const bone=root.getObjectByName(name) as Bone, child=root.getObjectByName(childName) as Bone;
    if(!bone?.isBone || !child?.isBone || !bone.parent) throw new Error(`Astronaut rig missing ${name}`);
    bone.getWorldPosition(origin);child.getWorldPosition(point);point.sub(origin).normalize();
    bone.getWorldQuaternion(world);bone.parent.getWorldQuaternion(parent).invert();
    const rotation=new Quaternion().setFromUnitVectors(point,new Vector3(...direction).normalize());
    bone.quaternion.copy(parent.multiply(rotation.multiply(world)));
    root.updateMatrixWorld(true);
  };
  // Asymmetric, relaxed limbs. Aim the real joints; never deform unweighted geometry.
  const arms=[['L','010','011','012',1],['R','021','022','023',-1]] as const;
  for(const [side,upper,fore,hand,sign] of arms){
    aim(`Bip001_${side}_UpperArm_${upper}`,`Bip001_${side}_Forearm_${fore}`,[sign*(side==='L'?.48:.34),-.88,side==='L'?.16:.23]);
    aim(`Bip001_${side}_Forearm_${fore}`,`Bip001_${side}_Hand_${hand}`,[sign*.16,-.84,side==='L'?.53:.40]);
  }
  for(const [side,thigh,calf,foot,sign] of [['L','032','033','034',1],['R','037','038','039',-1]] as const){
    aim(`Bip001_${side}_Thigh_${thigh}`,`Bip001_${side}_Calf_${calf}`,[sign*(side==='L'?.16:.12),-.98,side==='L'?.24:.05]);
    aim(`Bip001_${side}_Calf_${calf}`,`Bip001_${side}_Foot_${foot}`,[sign*.10,-.985,side==='L'?-.24:-.12]);
  }
  aim('Bip001_L_Foot_034','Bip001_L_Toe0_035',[.05,-.22,.97]);
  aim('Bip001_R_Foot_039','Bip001_R_Toe0_040',[-.05,-.28,.96]);
  // Loosen the flat bind-pose fingers, without adding skeletal animation.
  for(const name of ['Bip001_L_Finger11_018','Bip001_L_Finger12_00','Bip001_R_Finger11_029','Bip001_R_Finger12_030']){
    (root.getObjectByName(name) as Bone).rotateZ(.20);
  }
  const head=root.getObjectByName('Bip001_Head_07') as Bone;
  head.rotateY(-.10);head.rotateZ(-.06);
  root.updateMatrixWorld(true);
  const materials:MeshStandardMaterial[]=[];
  root.traverse(object=>{
    const mesh=object as SkinnedMesh;
    if(!mesh.isSkinnedMesh)return;
    const material=(mesh.material as MeshStandardMaterial).clone();
    material.side=FrontSide;
    if(material.name==='steklo'){
      material.color.set('#111924');material.metalness=.42;material.roughness=.18;
    }
    material.opacity=1;material.transparent=false;material.depthWrite=true;
    mesh.material=material;materials.push(material);
    mesh.castShadow=false;mesh.receiveShadow=false;
    mesh.skeleton.update();mesh.computeBoundingBox();
  });
  const bounds=new Box3().setFromObject(root), size=bounds.getSize(new Vector3()), center=bounds.getCenter(new Vector3());
  const scale=2.46/size.y;
  root.scale.multiplyScalar(scale);root.position.copy(center).multiplyScalar(-scale);root.position.y-=.19;
  const group=new Group();group.add(root);
  return {group,materials,dispose(){materials.forEach(m=>m.dispose());const skeletons=new Set<SkinnedMesh['skeleton']>();root.traverse(o=>{if((o as SkinnedMesh).isSkinnedMesh)skeletons.add((o as SkinnedMesh).skeleton);});skeletons.forEach(s=>s.dispose());}};
}
