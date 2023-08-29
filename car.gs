class Car {
  constructor(carType, origin){
    this.carType = carType;
    this.capacity = carType["capacity"];
    this.origin = origin;
    this.members = {};
  }

  getMembers(){
    let members = [];
    for(const point in this.members){
      if(this.members[point].length > 0){
        members = members.concat(this.members[point]);
      }
    }
    return members;
  }

  hasRentee(){
    if(this.getMembers().length == 0){
      return false;
    }else{
      return true;
    }
  }

  addMember(member){
    const point = member.getBoardPt();
    if(point in this.members){
      this.members[point].push(member);
    }else{
      this.members[point] = [member];
    }
    member.setAssigned();
  }

  clone(){
    let car = new Car(this.carType, this.origin);
    for(const member of this.getMembers()){
      car.addMember(member);
    }
    return car;
  }

  deleteMembersByPoint(point){
    const members = this.members[point];
    delete this.members[point];
    return members;
  }

  getWaypoints(){
    let waypoints = [];
    for(const point in this.members){
      if(point != this.origin){
        waypoints.push(point);
      }
    }
    return waypoints;
  }

  updateCarType(){
    this.carType = points[this.origin].getCarType(this.getNumMember());
  }

  merge(car){
    const members = car.getMembers();
    for(const member of members){
      this.addMember(member);
    }
  }

  isFull(){
    if(this.getMembers().length < this.capacity){
      return false;
    }else{
      return true;
    }
  }

  getNumMember(){
    return this.getMembers().length;
  }

  getNumVacant(){
    return this.capacity - this.getMembers().length;
  }

  getName(){
    let name = "";
    for(const point in this.members){
      name += point;
    }
    name += "配車[" + this.carType["name"] + "]";
    return name;
  }

  evaluate(){
    const waypointScore = this.getWaypoints().length * 1000;
    const expenceScore = this.carType["cost"];
    const totalScore = waypointScore + expenceScore;
    return totalScore;
  }
};