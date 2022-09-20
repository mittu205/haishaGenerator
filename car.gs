class Car {
  constructor(capacity, origin){
    this.capacity = capacity;
    this.origin = origin;
    this.members = [];
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
    this.members.push(member);
  }

  isFull(){
    if(this.members.length < this.capacity){
      return false;
    }else{
      return true;
    }
  }
};