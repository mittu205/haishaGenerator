class Point {
  constructor(name, lat, lon){
    this.ptName = name;
    this.numMember = 0;
    this.numRentee = 0;
    this.members = [];
    this.childPt = {};
    this.lat = lat;
    this.lon = lon;
    this.carCombi = [];
  }

  getLat(){
    return this.lat;
  }

  getLon(){
    return this.lon;
  }

  registerMember(member){
    totalMember++;
    this.numMember++;
    this.members.push(member);
    if(member.isRentee() == true){
      totalRentee++;
      this.numRentee++;
    }
  }

  addParentPtMember(){
    if(this.numRentee * 8 >= this.numMember){
      numAssigned += this.numMember;
    }else if(this.numRentee > 0){
      numAssigned += this.numRentee * 8;
    }
  }

  getRemainMember(){
    var count = this.numMember - this.numRentee * 8;
    if(count > 0){
      return count;
    }else{
      return 0;
    }
  }

  getNumMember(){
    return this.numMember;
  }

  getNumRentee(){
    return this.numRentee;
  }

  reduceNumMember(count){
    this.numMember -= count;
  }

  addChildPtMember(point){
    var vacant = this.numRentee * 8 - this.numMember;
    var count = points[point].getRemainMember();
    if(vacant > count){
      numAssigned += count;
      this.childPt[point] = count;
      this.numMember += count;
      points[point].reduceNumMember(count);
    }else if(vacant > 0){
      numAssigned += vacant;
      this.childPt[point] = vacant;
      this.numMember += vacant;
      points[point].reduceNumMember(vacant);
    }
  }

  setCarCombi(combi){
    this.carCombi = combi.slice();
  }
};