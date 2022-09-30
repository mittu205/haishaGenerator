class Member {
  constructor(name, location, driver){
    this.name = name;
    this.location = location;
    this.driver = driver;
    this.isAssigned = false;
  }

  getLocation(){
    return this.location;
  }

  isRentee(){
    if(this.driver == 2){
      return true;
    }else{
      return false;
    }
  }

  setAssigned(){
    this.isAssigned = true;
  }
};