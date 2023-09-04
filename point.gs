class Point {
  constructor(point){
    this.ptName = point["name"];
    this.members = [];
    this.lat = point["lat"];
    this.lon = point["lon"];
    this.carTypes = point["availableCars"];
    this.cars = [];
    this.carOptimizer = null;
    this.distanceTable = [];
  }

  getLat(){
    return this.lat;
  }

  getLon(){
    return this.lon;
  }

  initDistanceTable(){
    const R = Math.PI / 180;
    const convertRatio = 1.3035
    for(const point in points){
      if(point == this.ptName) continue;
      const lat1 = this.lat * R;
      const lon1 = this.lon * R;
      const lat2 = points[point].getLat() * R;
      const lon2 = points[point].getLon() * R;
      const distance = 6371 * Math.acos(Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1) + Math.sin(lat1) * Math.sin(lat2));
      this.distanceTable.push({"start": this.ptName, "goal": point, "distance": distance * convertRatio});
    }

    //近い順に並べ替え
    this.distanceTable.sort(function(a, b){
      if(a["dist"] < b["dist"]) return -1;
      if(a["dist"] > b["dist"]) return 1;
      return 0;
    });

    return this.distanceTable;
  }

  initCarOptimizer(carData){
    let cars = [];
    for(const carName of this.carTypes){
      const carType = carData.find(function(a){
        return a["name"] == carName;
      });
      if(carType === undefined) return -1;
      cars.push(carType);
    }
    this.carOptimizer = new CarOptimizer(cars, this.getDistance(destination));
    return 0;
  }

  getDistance(point){
    for(const pointPair of this.distanceTable){
      if(pointPair["goal"] != point) continue;
      return pointPair["distance"];
    }
  }

  registerMember(member){
    totalMember++;
    this.members.push(member);
    if(member.isRentee() == true){
      totalRentee++;
    }
  }

  addParentPtMember(){
    if(this.getNumRentee() * 8 >= this.getNumMember()){
      numAssigned += this.getNumMember();
    }else if(this.getNumRentee() > 0){
      numAssigned += this.getNumRentee() * 8;
    }
  }

  getRemainMember(){
    let count = this.getNumMember() - this.getNumRentee() * 8;
    if(count > 0){
      return count;
    }else{
      return 0;
    }
  }

  getNumMember(){
    return this.members.length;
  }

  getNumRentee(){
    let member;
    let count = 0;
    for(member of this.members){
      if(member.isRentee()){
        count++;
      }
    }
    return count;
  }

  moveMember(){
    let member;
    for(member of this.members){
      if(!(member.isRentee())){
        let i = this.members.indexOf(member);
        this.members.splice(i, 1);
        return member;
      }
    }
  }

  addChildPtMember(point){
    let vacant = this.getNumRentee() * 8 - this.getNumMember();
    let count = points[point].getRemainMember();
    while(vacant > 0 && count > 0){
      numAssigned++;
      this.registerMember(points[point].moveMember());
      vacant--;
      count--;
    }
  }

  setCars(combi){
    for(const carType of combi){
      this.cars.push(new Car(carType, this.ptName));
    }
  }

  getCarType(numMember){
    return this.carOptimizer.getCarType(numMember);
  }

  getChildPts(){
    let member;
    let childPts = [];
    for(member of this.members){
      let boardPt = member.getBoardPt();
      if(boardPt == this.ptName) continue;
      let childPt = childPts.find(function(point){
        return point["name"] == boardPt;
      });
      if(childPt === undefined){
        childPt = {"name": boardPt, "count": 0};
        childPts.push(childPt);
      }
      childPt["count"]++;
    }
    childPts.sort(function(a, b){
      if(a["count"] < b["count"]) return 1;
      if(a["count"] > b["count"]) return -1;
      return 0;
    });
    return childPts;
  }

  assignMembers(){
    if(this.getNumMember() == 0) return;
    let carCombi = this.carOptimizer.getCarCombi(this.getNumMember(), this.getNumRentee());
    this.setCars(carCombi);

    //借受人割り当て
    let car, member, point;
    for(member of this.members){
      if(member.isRentee() == true){
        for(car of this.cars){
          if(car.hasRentee() == false){
            car.addMember(member);
            break;
          }
        }
      }
    }

    //経由地参加者割り当て
    let childPts = this.getChildPts();
    for(point of childPts){
      let count = point["count"];
      for(car of this.cars){
        if(car.getNumVacant() >= count){
          for(member of this.members){
            if(member.getBoardPt() == point["name"]){
              car.addMember(member);
              count--;
            }
          }
          break;
        }
      }
      while(count > 0){
        for(member of this.members){
          if(member.getBoardPt() == point["name"] && member.isAssigned == false){
            for(car of this.cars){
              if(car.isFull() == false){
                car.addMember(member);
                count--;
                break;
              }
            }
          }
        }
      }
    }

    //その他参加者割り当て
    for(member of this.members){
      if(member.isAssigned == false){
        for(car of this.cars){
          if(car.isFull() == false){
            car.addMember(member);
            break;
          }
        }      
      }
    }

    return this.cars;
  }
};