google.charts.load('current', {
  packages: ['geochart'],
});
google.charts.setOnLoadCallback(drawVisualization);

function drawVisualization() {

  var data = new google.visualization.DataTable();

  data.addColumn('number', 'Lat');
  data.addColumn('number', 'Lon');
  data.addColumn('string', 'Country');
  data.addColumn('number', 'value');
  data.addColumn({
    type: 'string',
    role: 'tooltip'
  });

  var img_urls = {
    'Colombia': "https://i.ibb.co/4PMF2Jh/MAPAS-CO.png",
    'Argentina': "https://i.ibb.co/dtYqm6Q/MAPAS-AR.png",
    'Lesotho': "https://i.ibb.co/yF2w9FS/MAPAS-LS.png",
    'Eswatini': "https://i.ibb.co/0m0hKrm/MAPAS-ESWATINI-06.png",
    'Uganda': "https://i.ibb.co/k67BkDz/MAPAS-UG.png",
    'Botswana': "https://i.ibb.co/qmg2cw3/MAPAS-BW.png",
    'Angola': "https://i.ibb.co/LPtm8VJ/MAPAS-AO.png",
    'Romania': "https://i.ibb.co/hH29SnL/MAPAS-RO.png",
    'Tanzania': "https://i.ibb.co/jyKLbLn/MAPAS-TZ.png",
    'Malawi': "https://i.ibb.co/pn32frh/MAPAS-MW.png"
  }

  //  var ivalue = new Array();

  data.addRows([
    [4.711, -74.0721, 'Colombia', 0, '']
  ]);
  //  data.addRows([[4.711,-74.0721,'Colombia']]);
  //  data.addRows([[4.711,-74.0721,'Colombia']]);
  //  ivalue['4.711'] = '';

  data.addRows([
    [-34.6037, -58.3816, 'Argentina', 1, '']
  ]);
  // data.addRows([[-34.6037,-58.3816,'Argentina']]);
  //  ivalue['-34.6037'] = '';

  data.addRows([
    [-29.61, 28.2336, 'Lesotho', 2, '']
  ]);
  // data.addRows([[-29.61,28.2336,'Lesotho']]);
  //  ivalue['-29.61'] = '';

  data.addRows([
    [-22.3285, 24.6849, 'Botswana', 3, '']
  ]);
  // data.addRows([[-22.3285,24.6849,'Botswana']]);
  //  ivalue['-22.3285'] = '';

  data.addRows([
    [-26.5225, 31.4659, 'Eswatini', 4, '']
  ]);
  //  data.addRows([[-26.5225,31.4659,'Eswatini']]);
  //  ivalue['-26.5225'] = '';

  data.addRows([
    [1.3733, 32.2903, 'Uganda', 5, '']
  ]);
  // data.addRows([[1.3733,32.2903,'Uganda']]);
  //  ivalue['1.3733'] = '';

  data.addRows([
    [-11.2027, 17.8739, 'Angola', 6, '']
  ]);
  //  data.addRows([[-11.2027,17.8739,'Angola']]);
  //  ivalue['-11.2027'] = '';

  data.addRows([
    [-13.2543, 34.3015, 'Malawi', 7, '']
  ]);
  //  data.addRows([[-13.2543,34.3015,'Malawi']]);
  //  ivalue['-13.2543'] = '';

  data.addRows([
    [-6.369, 34.8888, 'Tanzania', 8, '']
  ]);
  //  data.addRows([[-6.369,34.8888,'Tanzania']]);
  //  ivalue['-6.369'] = '';

  data.addRows([
    [45.9432, 24.9668, 'Romania', 9, '']
  ]);
  //  data.addRows([[45.9432,24.9668,'Romania']]);
  //  ivalue['45.9432'] = '';

  var options = {
    backgroundColor: {
      fill: 'transparent', //background rectangle color
      stroke: '#FFFFFF', //a frame outside of and surrounding the map's rectangle area
      strokeWidth: 0
    },
    colorAxis: {
      minValue: 0,
      maxValue: 9,
      colors: ['#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000',] //pin color
    },
    legend: 'none',
    // datalessRegionColor: '#f5f5f5',
    datalessRegionColor: '#202020', //the color to fill each region
    datalessRegionColor: 'transparent', //the color to fill each region
    displayMode: 'markers',
    enableRegionInteractivity: 'true',
    resolution: 'countries',
    sizeAxis: {
      minValue: 1,
      maxValue: 1,
      minSize: 5,
      maxSize: 5
    },
    region: 'world',
    keepAspectRatio: true,
    width: 1200,
    height: 800,
    tooltip: {
      textStyle: {
        color: '#444444' //text color when hover over
      },
      trigger: 'focus',
      isHtml: true
    }
  };


  var chart = new google.visualization.GeoChart(document.getElementById('map'));

  var modal = document.getElementById("myModal");
  var modalImg = document.getElementById("img01");
  var span = document.getElementById("close");

  google.visualization.events.addListener(chart, 'select', function() {
    var selection = chart.getSelection();
    var value = data.getValue(selection[0].row, 2);
    console.log(value);

    modal.style.display = "block";
    modalImg.src = img_urls[value];
    console.log(modalImg.src)
    modalImg.style.width = 'auto';
    modalImg.style.height = '70%';
  })

  span.onclick = function() {
    modal.style.display = "none";
  }

  modal.onclick = function() {
    modal.style.display = "none";
  }

  var container = document.getElementById('map');
  google.visualization.events.addListener(chart, 'ready', function () { //change the borderline color of each region (e.g., country)
    var countries = container.getElementsByTagName('path');
    Array.prototype.forEach.call(countries, function(path) {
      path.setAttribute('stroke', 'white');
    });
  });

  chart.draw(data, options);

}