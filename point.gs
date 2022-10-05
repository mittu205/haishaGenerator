class Point {
  constructor(name, lat, lon){
    this.ptName = name;
    this.remainMember = 0;
    this.remainRentee = 0;
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
    this.remainMember++;
    this.members.push(member);
    if(member.isRentee() == true){
      totalRentee++;
      this.remainRentee++;
    }
  }

  addParentPtMember(){
    if(this.remainRentee * 8 >= this.remainMember){
      numAssigned += this.remainMember;
      this.remainMember = 0;
      this.remainRentee = 0;
    }else if(this.remainRentee > 0){
      numAssigned += this.remainRentee * 8;
      this.remainMember -= this.remainRentee * 8;
      this.remainRentee = 0;
    }
  }

  getRemainMember(){
    return this.remainMember;
  }

  getNumMember(){
    var count = this.members.length;
    var point;
    for(point in this.childPt){
      count += this.childPt[point];
    }
    return count;
  }

  getNumRentee(){
    var count = 0;
    var member;
    for(member of this.members){
      if(member.isRentee() == true) count++;
    }
    return count;
  }

  setChildPt(point, count){
    if(this.childPt[point] === undefined){
      this.childPt[point] = 0;
    }
    this.childPt[point] += count;
    if(count < 0){
      this.remainMember += count;
    }
  }

  addChildPtMember(point){
    var vacant = this.getNumRentee() * 8 - this.getNumMember();
    var count = points[point].getRemainMember();
    if(vacant > count){
      numAssigned += count;
      this.childPt[point] = count;
      points[point].setChildPt(this.ptName, count * -1);
    }else if(vacant > 0){
      numAssigned += vacant;
      this.childPt[point] = vacant;
      points[point].setChildPt(this.ptName, vacant * -1);
    }
  }

  setCarCombi(combi){
    this.carCombi = combi.slice();
  }
};