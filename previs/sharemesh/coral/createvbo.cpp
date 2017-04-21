String folder = "./";
String file = "interstice.obj";
 
ArrayList<PVector> srf = new ArrayList<PVector>();
ArrayList<PVector> norm = new ArrayList<PVector>();
ArrayList<int[]> faces = new ArrayList<int[]>();
 
void setup() {
  noLoop();
}
 
void draw() {
  loadSrf(folder+file);
  writeSrf(folder+file.substring(0,file.length()-3)+"vbo");
  exit();
}
 
void loadSrf(String name) {
  srf.clear();
  norm.clear();
  faces.clear();
  println("LOAD " + name);
  String[] lines = loadStrings(name);
  for(int i=0;i<lines.length;++i) {
   if(lines[i].length() > 2) {
      //vertices
      if (lines[i].substring(0,2).equals("v ")) {
        float info[] = float(split(lines[i], " "));
        srf.add(new PVector(info[1],info[2],info[3]));
      } 
      //normals
      else if(lines[i].substring(0,2).equals("vn")) {
        float info[] = float(split(lines[i], " "));
        norm.add(new PVector(info[1],info[2],info[3]));
      } 
      else if(lines[i].substring(0,2).equals("f ")) {
        String info[] = split(lines[i], " ");
        //sometimes obj's have different indices for different properties separated by '//'
        int info1[] = int(split(info[1],"//"));
        int info2[] = int(split(info[2],"//"));
        int info3[] = int(split(info[3],"//"));
        //obj has 1 based indexing and we need 0 based indexing
        faces.add(new int[] {info1[0]-1,info2[0]-1,info3[0]-1});
      }
    }
  }
}
 
//write the data in binary
void writeSrf(String name) {
  try {
    DataOutputStream dos = new DataOutputStream(new FileOutputStream(name));
    dos.writeInt(srf.size());
    dos.writeInt(faces.size());
    PVector v;
    for(int i=0;i<srf.size();++i) {
      v = srf.get(i);
      writeFloat(dos,v.x);
      writeFloat(dos,v.y);
      writeFloat(dos,v.z);
      v = norm.get(i);
      writeFloat(dos,v.x);
      writeFloat(dos,v.y);
      writeFloat(dos,v.z);
    }
    int[] f;
    for(int i=0;i<faces.size();++i) {
      f = faces.get(i);
      writeShort(dos,f[0]);
      writeShort(dos,f[1]);
      writeShort(dos,f[2]);
    }    
    dos.close();
  } catch(Exception e) {
  }
}
 
//write a float value little endian
void writeFloat(DataOutputStream dos, float f) throws IOException {
  int i = Float.floatToIntBits(f);
  dos.writeByte(i & 0xFF);
  dos.writeByte((i >> 8) & 0xFF);
  dos.writeByte((i >> 16) & 0xFF);
  dos.writeByte((i >> 24) & 0xFF);
}
 
//write a 16-bit integer little endian, integers larger than 65535 will get truncated
void writeShort(DataOutputStream dos, int i) throws IOException {
  dos.writeByte(i & 0xFF);
  dos.writeByte((i >> 8) & 0xFF);
}
