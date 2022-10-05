class Member {
  constructor(name, boardPt, driver){
    this.name = name;
    this.boardPt = boardPt;
    this.driver = driver;
    this.isAssigned = false;
  }

  getBoardPt(){
    return this.boardPt;
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