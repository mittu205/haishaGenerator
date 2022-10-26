class Car {
  constructor(capacity, origin){
    this.capacity = capacity;
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

  getOrigin(){
    return this.origin;
  }

  addMember(member){
    var point = member.getBoardPt();
    if(point != this.origin && this.waypoints.includes(point) == false){
      this.waypoints.push(point);
    }
    this.members.splice(1, 0, member);
    member.setAssigned();
  }

  isFull(){
    if(this.members.length < this.capacity){
      return false;
    }else{
      return true;
    }
  }

  getName(){
    var name = this.origin;
    var point;
    for(point of this.waypoints){
      name += point;
    }
    name += "配車";
    return name;
  }
};