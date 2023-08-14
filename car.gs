class Car {
  constructor(capacity, origin){
    this.capacity = capacity;
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

  isFull(){
    if(this.getMembers().length < this.capacity){
      return false;
    }else{
      return true;
    }
  }

  getNumVacant(){
    return this.capacity - this.getMembers().length;
  }

  getName(){
    let name = "";
    for(const point in this.members){
      name += point;
    }
    name += "配車";
    return name;
  }
};