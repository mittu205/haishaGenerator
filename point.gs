class Point {
  constructor(name, lat, lon){
    this.ptName = name;
    this.numMember = 0;
    this.numRentee = 0;
    this.members = [];
    this.childPt = {};
    this.lat = lat;
    this.lon = lon;
    this.cars = [];
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

  moveMember(){
    let member;
    for(member of this.members){
      if(!(member.isRentee())){
        this.numMember--;
        let i = this.members.indexOf(member);
        this.members.splice(i, 1);
        return member;
      }
    }
  }

  addChildPtMember(point){
    let vacant = this.numRentee * 8 - this.numMember;
    if(vacant <= 0) return;
    let count = points[point].getRemainMember();
    this.childPt[point] = 0;
    while(vacant > 0 && count > 0){
      numAssigned++;
      this.childPt[point]++;
      this.registerMember(points[point].moveMember());
      vacant--;
      count--;
    }
  }

  setCars(combi){
    let capacity;
    for(capacity of combi){
      let car = new Car(capacity, this.ptName);
      this.cars.push(car);
    }
  }

  assignMembers(){
    let car, member, point;
    for(member of this.members){  //借受人割り当て
      if(member.isRentee() == true){
        for(car of this.cars){
          if(car.hasRentee() == false){
            car.addMember(member);
            break;
          }
        }
      }
    }
    for(point in this.childPt){ //経由地参加者割り当て
      let count = this.childPt[point];
      for(member of this.members){
        if(member.getBoardPt() == point && member.isAssigned == false){
          for(car of this.cars){
            if(car.isFull() == false){
              car.addMember(member);
              count--;
              break;
            }
          }
        }
        if(count == 0) break;
      }
    }
    for(member of this.members){  //その他参加者割り当て
      if(member.isAssigned == false){
        for(car of this.cars){
          if(car.isFull() == false){
            car.addMember(member);
            break;
          }
        }      
      }
    }
  }
};