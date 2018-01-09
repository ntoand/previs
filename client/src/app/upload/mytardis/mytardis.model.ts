export class Experiment {
  id: number;
  title: string;
  description: string;
  created_time: string;
  
  constructor() {}
}

export class Dataset {
  id: number;
  description: string;
  
  constructor() {}
}

export class Datafile {
  id: number;
  filename: string;
  mimetype: string;
  
  constructor() {}
}