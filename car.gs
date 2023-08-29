class Car {
  constructor(carType, origin){
    this.carType = carType;
    this.capacity = carType["capacity"];
    this.origin = origin;
    this.members = [];
    this.waypoints = [];
  }

  hasRentee(){
    if(this.members.length == 0){
      return false;
    }else{
      return true;
    }
  }

  addMember(member){
    let point = member.getBoardPt();
    if(point != this.origin){
      this.members.push(member);
    }else{
      this.members.splice(1, 0, member);
    }
    member.setAssigned();
  }

  isFull(){
    if(this.members.length < this.capacity){
      return false;
    }else{
      return true;
    }
  }

  getNumVacant(){
    return this.capacity - this.members.length;
  }

  getName(){
    let member;
    let name = "";
    let waypoints = [];
    for(member of this.members){
      let point = member.getBoardPt();
      if(waypoints.includes(point) == false){
        waypoints.push(point);
        name += point;
      }
    }
    name += "配車[" + this.carType["name"] + "]";
    return name;
  }
};