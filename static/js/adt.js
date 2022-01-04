/*
 * Advanced Date Time picker
 * Uses Pikaday for the date, adds up/down button on year/month/day
 */


class Adt
{
  constructor({field, defaultDate, callback})
  {
    this.field = field;
    this.callback = callback;

    this.picker = new Pikaday(
    {   
      field: document.getElementById("datepicker"), 
      position: "top right",
      keyboardInput: "false",
      format: 'YYYY MM DD',
      defaultDate : defaultDate,
      setDefaultDate : true
    });
    this.picker.setMoment(defaultDate);

    var btn1 = this.buttonUp();
    var btn2 = this.buttonUp();
    var btn3 = this.buttonUp();

    this.field.appendChild(document.createElement('br'));
    this.field.appendChild(btn1);  
    this.field.appendChild(btn2);  
    this.field.appendChild(btn3);  
    this.field.appendChild(document.createElement('br'));

    var btn4 = this.buttonDown();
    var btn5 = this.buttonDown();
    var btn6 = this.buttonDown();
    this.field.appendChild(btn4);  
    this.field.appendChild(btn5);  
    this.field.appendChild(btn6); 

    btn1.addEventListener('click', (event) => this.incDate(this.picker, 1, 'year'));
    btn2.addEventListener('click', (event) => this.incDate(this.picker, 1, 'month'));
    btn3.addEventListener('click', (event) => this.incDate(this.picker, 1, 'day'));
    btn4.addEventListener('click', (event) => this.incDate(this.picker, -1, 'year'));
    btn5.addEventListener('click', (event) => this.incDate(this.picker, -1, 'month'));
    btn6.addEventListener('click', (event) => this.incDate(this.picker, -1, 'day'));
  }

  incDate = (picker, n, interval) => 
  {
    var date = picker.getMoment();
    date = date.add(n, interval);
    picker.setMoment(date);
    this.callback();
  }

  buttonUp()
  {
    var btn = document.createElement("BUTTON");
    btn.innerHTML = "<i>&#9650;</i>";
    btn.className = "adt-small-button" 
    return btn; 
  }

  buttonDown()
  {
    var btn = document.createElement("BUTTON");
    btn.innerHTML = "<i>&#9660;</i>";
    btn.className = "adt-small-button" 
    return btn; 
  }
}

