
const cities = [
  { name: "Seattle, Washington", file: "./Weather Data/KSEA.csv", acro: "KSEA"},
  { name: "Charlotte, North Carolina", file: "./Weather Data/CLT.csv", acro: "CLT" },
  { name: "Los Angeles, California", file: "./Weather Data/CQT.csv", acro: "CQT" },
  { name: "Indianapolis, Indiana", file: "./Weather Data/IND.csv" , acro: "IND"},
  { name: "Jacksonville, Florida", file: "./Weather Data/JAX.csv", acro: "JAX" },
  { name: "Chicago, Illinois", file: "./Weather Data/MDW.csv", acro: "MDW" },
  { name: "Philadelphia, Pennsylvania", file: "./Weather Data/PHL.csv", acro: "PHL" },
  { name: "Phoenix, Arizona", file: "./Weather Data/PHX.csv", acro: "PHX" },
  { name: "Houston, Texas", file: "./Weather Data/KHOU.csv", acro: "KHOU" },
  { name: "New York, New York", file: "./Weather Data/KNYC.csv", acro: "KNYC" }
];

let currentCity = cities[0];
let currentTemp = 'actual_mean_temp';

// change csv file depending on the city selected
// returning certain attributes from dataset
function renderCity(city, temp) {
  d3.csv(city.file, (d) => {
    return {temp: +d[temp],
      maxTempDate: +d.record_min_temp_year,
      minTempDate: +d.record_max_temp_year,
      precip: +d.actual_precipitation,
      date: new Date(d.date)
    };
   
  }).then((data) => {
    // Remove existing chart and redraw with new data
    const svg = d3.select("svg");
    svg.remove();
    const result = renderRadialDiagram(data);
    document.body.appendChild(result.node());
   // console.log(data);
  });
}

// event listenter for temperature change
function onTempChanged() {
  // get the selected option from the dropdown
  const select = document.getElementById("tempSelect");
  currentTemp = select.options[select.selectedIndex].value;
  //console.log(currentTemp);
  // render current city with the new temperature data
  renderCity(currentCity, currentTemp);
}

// event listener for city change
function onCityChanged() {
  // get the selected option from the dropdown
  const citySelect = document.getElementById("citySelect");
  const selectedCityName = citySelect.options[citySelect.selectedIndex].value;
  // console.log(selectedCityName)
  for (let i = 0; i < cities.length; i++) {
    if (cities[i].acro === selectedCityName) {
      currentCity = cities[i];
      console.log(`Selected city: ${selectedCityName}`);
      renderCity(currentCity, currentTemp);
      break;
    }
  }
}

// render diagram with default selected values
renderCity(currentCity, currentTemp);

// render diagram function
function renderRadialDiagram(data) {
  const width = 600;
  const height = 600;

  // create main svg element
  const svg = d3
  .create('svg')
  .attr('width', width)
  .attr('height', height)
  .style('font-family', 'sans-serif')
  .style('font-size', 10)
  .style('border', '1px solid #777');

  // append g to svg element
  const center = svg
  .selectAll('.center')
  .data([1])
  .join('g')
  .attr('class', 'center')
  .attr('transform', `translate(${width},${height})`);

  // create circle angles
  const eachAngle = (2 * Math.PI) / data.length;
  const maxOuterRadius = (width / 2) * 0.9;
  const minInnerRadius = (width / 2) * 0.5;

  const extent = d3.extent(data, (d) => d.temp);
  const min = extent[0];
  const max = extent[1];

  // value scale according to temperature data
  const valueScale = d3
  .scaleLinear()
  .domain([-20, 130])
  .range([minInnerRadius, maxOuterRadius]);

  // color scale 
  const colorScale = d3
  .scaleLinear()
  .domain([min, 30, 40, 50, 60, 70, 80, 90, max])
  .range(['darkblue', 'darkblue', 'deepskyblue', 'skyblue', 'gold', 'darkorange', 'orangered', 'red', 'darkred', '#4d0000']);

  // darkblue: min - 30
  // deepskyblue: 30 - 40
  // skyblue: 40 - 50
  // gold: 50 - 60
  // darkorange: 60 - 70
  // orangred: 70 - 80
  // red: 80 - 90
  // darkred: 90-max
 

  //const fixedInnerRadius = 100; 
  //const fixedOuterRadius = 500;

  data.forEach((d, i) => { 
    d.startAngle = i * eachAngle;
    d.endAngle = (i + 1) * eachAngle;

    // min temp in each csv
    const zeroRadius = valueScale(0);

    // keeping inner radius zero no matter the temp data
    d.innerRadius = zeroRadius;
    // outer radius is range of temp data
    d.outerRadius = valueScale(d.temp);

  });

  // tooltip !!
  const tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-30, 30])
  .style('opacity', 0.9)
  .html(function(d) {
    // if daily averages, return temp, date, and precipitation
    if (currentTemp === 'actual_mean_temp') {
      return`<div class="tooltip-box"><strong>Average Temperature:</strong> <span>${d.temp}&deg;F</span><br><strong>Date: </strong> ${d.date.toLocaleDateString()}<br><strong>Precipitation:</strong> <span>${d.precip}mm</span></div>`;
    // if record mins, return temp, day, and year recorded
    } else if (currentTemp === 'record_min_temp') {
      return `<div class="tooltip-box"><strong>Record Minimum Temperature:</strong> <span>${d.temp}&deg;F</span><br><strong>Date: </strong><span>${d.date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}</span><br><strong>Year Recorded:</strong> ${d.minTempDate}</div>`;
    // if record maxes, return temp, day, and year recorded
    } else if (currentTemp === 'record_max_temp') {
      return`<div class="tooltip-box"><strong>Record Maximum Temperature:</strong> <span>${d.temp}&deg;F</span><br><strong>Date: </strong><span>${d.date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}</span><br><strong>Year Recorded:</strong> ${d.maxTempDate}</div>`;
    }
  });

  svg.call(tip);


  const arc = d3
  .arc()
  .innerRadius((d) => d.innerRadius)
  .outerRadius((d) => d.outerRadius)
  .startAngle((d) => d.startAngle)
  .endAngle((d) => d.endAngle);

  // adding the temperature bars
  center
  .selectAll('.radial-bar')
  .data(data)
  .join('path')
  .attr('class', 'radial-bar')
  .attr('d', (d) => {
    return arc(d) ;
  })
  // bar color according to temp value color scale
  .attr('fill', (d) => colorScale(d.temp))
  .attr('stroke', 'black')
  .attr('stroke-witdh', 0.2)
  // tool tip effects
  .on('mouseover', function(d) {
    d3.select(this)
      .transition()
      .duration(200)
      .attr('transform', `scale(1.08)`)
    tip.show(d, this);
  })
  .on('mouseout', function(d) {
    d3.select(this)
      .transition()
      .duration(200)
      .attr('transform', `scale(1)`)
    tip.hide(d, this);
  });

  // number of temp labels
  const scaleTicks = valueScale.ticks(7);

  // adding circles within diagram
  center
  .selectAll('.radial-circle')
  .data(scaleTicks)
  .join('circle')
  .attr('r', (d) => valueScale(d))
  .attr('fill', 'none')
  .attr('stroke', 'black')
  .attr('opacity', 0.2);

  // temp tick label text
  center
  .selectAll('.radial-text')
  .data(scaleTicks)
  .join('text')
  .text((d) => d)
  .attr('y', (d) => -valueScale(d))
  .attr('stroke-width', 5)
  .attr('stroke', 'white')
  .clone(true)
  .attr('stroke', 'none');

  // current city name displayed in the center of diagram
  center
  .append('text')
  .text(currentCity.name)
  .attr('class', 'city-label')
  .attr('text-anchor', 'middle')
  .attr('alignment-baseline', 'center')
  .style('font-size', '20px')
  .style('font-weight', 'bold')
  .attr('y', -5);

  // get tempSelect name from html
  function getTemperatureAttributeName() {
    const tempSelect = document.getElementById('tempSelect');
    const selectedOption = tempSelect.options[tempSelect.selectedIndex];
    return selectedOption.getAttribute('name');
  }

  // current temp description displayed in the center of diagram
  center
  .append('text')
  .text(getTemperatureAttributeName())
  .attr('class', 'city-temp')
  .attr('text-anchor', 'middle')
  .attr('alignment-baseline', 'center')
  .style('font-size', '14px')
  .style('font-weight', 'normal')
  .attr('y', 20);

  // months array
  const months = [
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
 ];

// month labels
  const g = center
    .selectAll('.radial-axis-g')
    .data(months)
    .join('g')
    .attr('transform', (d, i) => {
       const angle = (360 / months.length) * i - 90;
       return `rotate(${angle})`;
     });

    g.append('line')
    .attr('x1', minInnerRadius)
    .attr('y1', 0)
    .attr('x2', maxOuterRadius)
    .attr('y2', 0)
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('opacity', 0.2);

 const rotationAngles = [90, 60, 30, 0, -30, -60, -90, 240, 210, 180, 150, 120];

    // changing rotation of month labels
    g.append('text')
    .text((d) => d)
    .style("font-weight", "bold")
    .attr('transform', (d, i) => {
      let x = maxOuterRadius + 7;
      let y = 0;
      const rotation = rotationAngles[i];
      if (i > 6 && i < 11) {
        x = x + 10;
        y = y - 3;
      }
      if (i > 1 && i < 6) {
        y = y +3;
      }
      if (i=== 6) {
        x = x + 7;
        y = y + 6;
      }
      if (i > 6 && i < 12) {
        x = x + 4;
      }
      if (i === 0 || i === 1 || i === 11) {
        y = y -5;
      }
      if (i === 5) {
        x = x + 5;
      }
      if (i == 7) {
        x = x - 5;
        y = y + 4;
      }
      return `translate(${x},${y}) rotate(${rotation})`;
    });

  // return full diagrm
   return svg;
}
