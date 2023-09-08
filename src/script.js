let runnerData = []
const init = async () => {
    document.querySelector('#runnerSearch_input').addEventListener('input', onSearchChanged)

    runnerData = await getRunnerData()
    runnerData = runnerData.sort((a, b) => {
        if (a.name < b.name)
            return -1;
        if (a.name > b.name)
            return 1;
        return 0
    });

    runnerData = runnerData.sort((a, b) => {
        if (a.attempts < b.attempts)
            return 1;
        if (a.attempts > b.attempts)
            return -1;
        return 0
    });

    displayRunnerList(runnerData);

    populateOverallStats(runnerData);
    appendOverallHistogram(runnerData);
}

let page = 0
let maxCountPerPage = 10


const displayRunnerList = (list) => {
    let holder = document.querySelector('#runner-holder');

    while (holder.childNodes[4]) {
        holder.removeChild(holder.childNodes[4]);
    }

    let paginatedList = list.slice(page, page + maxCountPerPage)
    for (let i = 0; i < paginatedList.length; i++) {
        let runner = paginatedList[i]
        let listItem = document.createElement('div')
        listItem.className = 'runnerData'
        listItem.innerHTML = runnerListItem(runner)
        listItem.data = runner
        holder.appendChild(listItem)

        appendLapHistogram(runner)
        appendTimeLapLineGraph(runner)

        listItem.querySelector('.runner').onclick = () => {
            if (listItem.className === 'runnerData')
                listItem.className = "runnerData extended"
            else if (listItem.className === "runnerData extended")
                listItem.className = 'runnerData'
        }
    }

    let prevPage = false, nextPage = false;
    if (page > 0 || page + maxCountPerPage <= paginatedList.length) {
        let listItem = document.createElement('div')
        listItem.className = 'pagination row u-full-width'

        if (page > 0) {
            listItem.innerHTML += `<button id='prevRunnerPage_button' class="button">Prev Page</button>`
            prevPage = true
        }

        listItem.innerHTML += `<div id='pageCount'>${page / maxCountPerPage + 1}/${Math.floor(list.length / maxCountPerPage + 1)}</div>`

        if (page + maxCountPerPage <= list.length) {
            nextPage = true
            listItem.innerHTML += `<button id='nextRunnerPage_button' class="button">Next Page</button>`
        }

        const gotoPrevPage = () => { page -= maxCountPerPage; displayRunnerList(list) }
        const gotoNextPage = () => { page += maxCountPerPage; displayRunnerList(list); }

        holder.appendChild(listItem)

        if (prevPage)
            holder.querySelector('#prevRunnerPage_button').onclick = gotoPrevPage

        if (nextPage)
            holder.querySelector('#nextRunnerPage_button').onclick = gotoNextPage
    }
}

const runnerListItem = (runner) => {
    let totalLaps = runner.raceData
        .map(a => parseInt(a.lapCount))
        .reduce((acc, b) => acc + b)

    let totalTime = runner.raceData
        .map(a => (a.totalTime[0] + a.totalTime[1] / 60 + a.totalTime[0] / 3600))
        .reduce((acc, b) => acc + b)

    totalTime *= 3600
    let totalHours = Math.floor(totalTime / 3600)
    totalTime = totalTime - (totalHours * 3600)
    let totalMinutes = Math.floor(totalTime / 60)
    totalTime = totalTime - (totalMinutes * 60)
    let totalSeconds = Math.round(totalTime)

    totalTime = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`

    let fastestLapTime = runner.raceData
        .sort((a, b) => compareTime(a.fastest, b.fastest))[0].fastest
        .map(t => t.toString().padStart(2, '0'))
        .join(':')
    fastestLapTime += ` (${runner.raceData.sort((a, b) => compareTime(a.fastest, b.fastest))[0].year})`

    let slowestLapTime = runner.raceData
        .sort((a, b) => compareTime(b.slowest, a.slowest))[0].slowest
        .map(t => t.toString().padStart(2, '0'))
        .join(':')
    slowestLapTime += ` (${runner.raceData.sort((a, b) => compareTime(a.slowest, b.slowest))[0].year})`

    let averageLapTime = runner.raceData
        .map(a => (a.average[0] + a.average[1] / 60 + a.average[0] / 3600))
        .reduce((acc, b) => acc + b)
    averageLapTime /= runner.raceData.length

    averageLapTime *= 3600
    let avgHour = Math.floor(averageLapTime / 3600)
    averageLapTime = averageLapTime - (avgHour * 3600)
    let avgMin = Math.floor(averageLapTime / 60)
    averageLapTime = averageLapTime - (avgMin * 60)
    let avgSec = Math.round(averageLapTime)

    averageLapTime = `${avgHour.toString().padStart(2, '0')}:${avgMin.toString().padStart(2, '0')}:${avgSec.toString().padStart(2, '0')}`

    let lowestBib = runner.raceData.sort((a, b) => parseInt(a.bib) - parseInt(b.bib))[0].bib
    lowestBib += ` (${runner.raceData.sort((a, b) => parseInt(a.bib) - parseInt(b.bib))[0].year})`

    let totalDistanceMiles = totalLaps * 4.2
    let totalDistanceKilo = totalLaps * 4.2 * 1.60934

    totalDistanceMiles = Math.round(totalDistanceMiles * 100) / 100
    totalDistanceKilo = Math.round(totalDistanceKilo * 100) / 100

    let lapCountSorted = runner.raceData.sort((a, b) => a.lapCount - b.lapCount)
    let minLaps = lapCountSorted[0].lapCount
    let minLapsYear = lapCountSorted[0].year

    let maxLaps = lapCountSorted[lapCountSorted.length - 1].lapCount
    let maxLapsYear = lapCountSorted[lapCountSorted.length - 1].year

    return `
        <div class="row runner">
            <div class="six columns">${runner.indexName}</div>
            <div class="two columns attempts">${totalTime}</div>
            <div class="two columns attempts">${totalLaps}</div>
            <div class="two columns attempts">${runner.attempts}</div>
        </div>
        <div class="stats container u-full-width">
            <div class="row">
                <div class="four columns">
                    <b>Stats</b>
                    <div>Total Laps: ${totalLaps}</div>
                    <div>Total Race Time: ${totalTime}</div>
                    <div>Total Distance: ${totalDistanceMiles} Miles (${totalDistanceKilo} km)</div>
                    <div>Fastest Lap Time: ${fastestLapTime}</div>
                    <div>Slowest Lap Time: ${slowestLapTime}</div>
                    <div>Average Lap Time: ${averageLapTime}</div>
                    <div>Max Laps: ${maxLaps} (${maxLapsYear})</div>
                    <div>Min Laps: ${minLaps} (${minLapsYear})</div>
                    <div>Lowest Bib: ${lowestBib}</div>
                </div>
                <div class="eight columns">
                    <div id="${runner.indexName.replaceAll(' ', '_').toLowerCase()}_histogram"></div>
                    <div id="${runner.indexName.replaceAll(' ', '_').toLowerCase()}_line"></div>
                </div>
            </div>
        </div>
    `
}

const appendLapHistogram = (runner) => {
    let data = runner.raceData.sort((a, b) => parseInt(b.year) - parseInt(a.year)).map((d, i) => d.splits.map(t => {
        return {
            value: t[0] * 60 + t[1] + t[2] / 60,
            year: d.year,
            yearIndex: i,
        }
    })).reverse()
    let dataYears = runner.raceData.map(d => d.year)

    let region = document.querySelector(`#${runner.indexName.replaceAll(' ', '_').toLowerCase()}_histogram`)

    let margin = { top: 25, right: 35, bottom: 35, left: 40 };
    let width = region.offsetWidth - margin.left - margin.right;
    let height = (width / 1.5) - margin.top - margin.bottom;

    let svg = d3.select(`#${runner.indexName.replaceAll(' ', '_').toLowerCase()}_histogram`)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)

    let xAxisGroup = svg.append('g')
    let xAxisText = svg.append('text')
        .attr('transform', `translate(${width / 2 + margin.left}, ${height + 30})`)
        .style('text-anchor', 'middle')

    let yAxisGroup = svg.append('g')
    let yAxisText = svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('dy', margin.left / 2 - 5)
        .attr('dx', -(height) / 2)
        .style('text-anchor', 'middle')
        .text('Laps');

    let xMax = Math.ceil(d3.max(data, d => d3.max(d, s => s.value)))
    let xMin = Math.floor(d3.min(data, d => d3.min(d, s => s.value)))

    let xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([margin.left, width + margin.right]);

    xAxisGroup
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    xAxisText.text('Lap Time (Minutes)');

    let histogram = d3.histogram()
        .value(d => d.value)
        .domain(xScale.domain())
        .thresholds(xScale.ticks(25));

    let bins = [];
    data.forEach(d => bins.push(...histogram(d)))

    let yMax = d3.max(bins, d => d.length);
    let yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([height, margin.top])

    let cScale = d3
        .scaleOrdinal(d3.schemeTableau10)
        .domain([0, years.length]);

    yAxisGroup
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(
            d3.axisLeft(yScale)
                .ticks(yMax)
                .tickFormat(d3.format('d'))
        );

    svg.selectAll('rect')
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.x0) + 1)
        .attr('width', d => xScale(d.x1) - xScale(d.x0))
        .attr('y', d => yScale(d.length))
        .attr('height', d => height - yScale(d.length))
        .style('fill', d => { if (d[0]) return cScale(d[0].yearIndex); return 'rgb(0,0,0)' });


    svg.selectAll('legendDots')
        .data(dataYears)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => margin.left + (width / 2) + (dataYears.length * 65) * (((i + 1) / (dataYears.length)) - 0.5) - 30)
        .attr('cy', 10)
        .attr('r', 7)
        .style('fill', (d, i) => cScale(i))

    svg.selectAll('legendLabels')
        .data(dataYears)
        .enter()
        .append('text')
        .attr('x', (d, i) => margin.left + (width / 2) + (dataYears.length * 65) * (((i + 1) / (dataYears.length)) - 0.5) - 20)
        .attr('y', 10)
        .style('fill', (d, i) => cScale(i))
        .text(d => d)
        .attr('text-anchor', 'right')
        .style('alignment-baseline', 'middle')
}

const appendTimeLapLineGraph = (runner) => {
    let data = runner.raceData.sort((a, b) => parseInt(b.year) - parseInt(a.year)).map((d, i) => d.splits.map(t => {
        return {
            value: t[0] * 60 + t[1] + t[2] / 60,
            year: d.year,
            yearIndex: i,
        }
    })).reverse()
    let dataYears = runner.raceData.map(d => d.year)

    let region = document.querySelector(`#${runner.indexName.replaceAll(' ', '_').toLowerCase()}_line`)

    let margin = { top: 25, right: 35, bottom: 35, left: 40 };
    let width = region.offsetWidth - margin.left - margin.right;
    let height = (width / 1.5) - margin.top - margin.bottom;

    let svg = d3.select(`#${runner.indexName.replaceAll(' ', '_').toLowerCase()}_line`)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)

    let xAxisGroup = svg.append('g')
    let xAxisText = svg.append('text')
        .attr('transform', `translate(${width / 2 + margin.left}, ${height + 30})`)
        .style('text-anchor', 'middle')

    let yAxisGroup = svg.append('g')
    let yAxisText = svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('dy', margin.left / 2 - 5)
        .attr('dx', -(height) / 2)
        .style('text-anchor', 'middle')
        .text('Lap Time (Minutes)');

    let xMax = Math.ceil(d3.max(data, d => d.length)) + 1
    let xScale = d3.scaleLinear()
        .domain([0, xMax])
        .range([margin.left, width + margin.right]);

    xAxisGroup
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    xAxisText.text('Lap');

    let yMax = d3.max(data, d => d3.max(d, s => s.value));
    let yMin = Math.floor(d3.min(data, d => d3.min(d, s => s.value)))
    let yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height, margin.top])

    yAxisGroup
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    let cScale = d3
        .scaleOrdinal(d3.schemeTableau10)
        .domain([0, years.length]);

    let line = d3.line()
        .x((d, i) => xScale(i + 1))
        .y((d) => yScale(d.value))

    data.forEach(race => {
        svg.selectAll('linegraph ' + race.year)
            .data([race])
            .enter()
            .append('path')
            .attr('d', line)
            .style("fill", "none")
            .style("stroke", d => cScale(d[0].yearIndex))

        svg.selectAll('linegraph dots ' + race.year)
            .data(race)
            .enter()
            .append('circle')
            .attr('cx', (d, i) => xScale(i + 1))
            .attr('cy', (d) => yScale(d.value))
            .attr('r', 5)
            .style("fill", d => cScale(d.yearIndex))
    })

    svg.selectAll('legendDots')
        .data(dataYears)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => margin.left + (width / 2) + (dataYears.length * 65) * (((i + 1) / (dataYears.length)) - 0.5) - 30)
        .attr('cy', 10)
        .attr('r', 7)
        .style('fill', (d, i) => cScale(i))

    svg.selectAll('legendLabels')
        .data(dataYears)
        .enter()
        .append('text')
        .attr('x', (d, i) => margin.left + (width / 2) + (dataYears.length * 65) * (((i + 1) / (dataYears.length)) - 0.5) - 20)
        .attr('y', 10)
        .style('fill', (d, i) => cScale(i))
        .text(d => d)
        .attr('text-anchor', 'right')
        .style('alignment-baseline', 'middle')
}

const onSearchChanged = (search) => {
    page = 0
    search = search.target.value

    let terms = search.split(',')
    let fileteredList = []
    terms.forEach(term => {
        if (terms.length > 1 && term === '')
            return;

        let filtered = runnerData.filter(r => r.name.toUpperCase().indexOf(term.trim().toUpperCase()) > -1)
        fileteredList.push(...filtered)
    })

    displayRunnerList(fileteredList)
}

const populateOverallStats = (raceData) => {
    let holder = document.querySelector('#overall-holder');
    holder.removeChild(holder.childNodes[0]);

    holder.innerHTML = overallStatsDisplay(raceData)
}

const overallStatsDisplay = (raceData) => {
    let totalLaps = raceData.map(d => d.totalLaps).reduce((acc, d) => acc + d)
    let totalTime = Math.round(raceData.map(d => d.totalTime).reduce((acc, d) => acc + d) * 100) / 100

    let lapRecord = raceData
        .sort((a, b) => {
            if (a.name < b.name)
                return -1;
            if (a.name > b.name)
                return 1;
            return 0
        })
        .sort((a, b) => b.lapRecord[0] - a.lapRecord[0])[0]

    let fastestRacer = raceData
        .sort((a, b) => compareTime(a.fastest, b.fastest))[0]

    let fastestLap = fastestRacer.fastest
    let fastestYear = fastestLap[3]
    fastestLap = `${fastestLap[0].toString().padStart(2, '0')}:${fastestLap[1].toString().padStart(2, '0')}:${fastestLap[2].toString().padStart(2, '0')}`

    let slowestRacer = raceData.sort((a, b) => compareTime(b.slowest, a.slowest))[0]
    let slowestLap = slowestRacer.slowest
    let slowestYear = slowestLap[3]
    slowestLap = `${slowestLap[0].toString().padStart(2, '0')}:${slowestLap[1].toString().padStart(2, '0')}:${slowestLap[2].toString().padStart(2, '0')}`

    let totalDistanceMiles = totalLaps * 4.2
    let totalDistanceKilo = totalLaps * 4.2 * 1.60934

    totalDistanceMiles = Math.round(totalDistanceMiles * 100) / 100
    totalDistanceKilo = Math.round(totalDistanceKilo * 100) / 100

    return `
    <div class="row">
        <div class="four columns">
            <b>Overall Stats</b>
            <div>- Years: <i>${years.map(y => y.year).reverse().join(', ')}</i></div>
            <div>- Total Participents: ${raceData.length}</div>
            <div>- Total Laps: ${totalLaps}</div>
            <div>- Total Time (Hours): ${totalTime}</div>
            <div>- Total Distance: ${totalDistanceMiles} Miles (${totalDistanceKilo} km)</div>
            <div>- Lap Record: ${lapRecord.lapRecord[0]} (${lapRecord.name} <i>${lapRecord.lapRecord[1]}</i>)</div>
            <div>- Fastest: ${fastestLap} (${fastestRacer.name} <i>${fastestYear}</i>)</div>
            <div>- Longest: ${slowestLap} (${slowestRacer.name} <i>${slowestYear}</i>)</div>
        </div>
            <div class="eight columns">
            <div id="overall_histogram"></div>
        </div>
    </div>
    `
}

const appendOverallHistogram = (raceData) => {
    let data = years.map(y => { return { year: y.year, splits: [], hidden: false } })

    raceData.forEach(runner => {
        runner.raceData.forEach(race => {
            let year = data.find(y => y.year === race.year)

            if (!year) {
                console.error("Could not find year " + year.year)
            }

            year.splits.push(...race.splits.map(t => t[0] * 60 + t[1] + t[2] / 60))
        })
    })

    let region = document.querySelector(`#overall_histogram`)

    let margin = { top: 25, right: 35, bottom: 35, left: 45 };
    let width = region.offsetWidth - margin.left - margin.right;
    let height = (width / 1.5) - margin.top - margin.bottom;

    let svg = d3.select(`#overall_histogram`)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)

    let xAxisGroup = svg.append('g')
    let xAxisText = svg.append('text')
        .attr('transform', `translate(${width / 2 + margin.left}, ${height + 30})`)
        .style('text-anchor', 'middle')

    let yAxisGroup = svg.append('g')
    let yAxisText = svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('dy', margin.left / 2 - 5)
        .attr('dx', -(height) / 2)
        .style('text-anchor', 'middle')
        .text('Laps');

    let xMax = Math.ceil(d3.max(data, d => d3.max(d.splits)))
    let xMin = Math.floor(d3.min(data, d => d3.min(d.splits)))

    let xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([margin.left, width + margin.right]);

    xAxisGroup
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    xAxisText.text('Lap Time (Minutes)');

    let cScale = d3
        .scaleOrdinal(d3.schemeTableau10)
        .domain([0, years.length]);

    let histogram = d3.histogram()
        .value(d => d)
        .domain(xScale.domain())
        .thresholds(xScale.ticks(50));

    let yMax = 0;
    data.forEach(year => {
        let bins = histogram(year.splits);
        let max = d3.max(bins, d => d.length);

        if (max > yMax) {
            yMax = max
        }
    })

    let yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([height, margin.top])

    yAxisGroup
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(
            d3.axisLeft(yScale)
                .tickFormat(d3.format('d'))
        );

    let dataGroup = svg
        .append('g')

    const drawHistogram = () => {
        dataGroup.selectAll("g > *").remove();

        data.forEach((year, i) => {
            let selector = `.rects_${year.year}`
            if (year.hidden) {
                return
            }

            let bins = histogram(year.splits)

            let graph = dataGroup.selectAll(selector)
                .data(bins, d => year.year)

            graph
                .enter()
                .append("rect")
                .classed(selector, true)
                .attr("x", d => xScale(d.x0) + 1)
                .attr('width', d => xScale(d.x1) - xScale(d.x0))
                .style('fill', d => cScale(i))
                .attr('y', d => yScale(d.length))
                .attr('height', d => height - yScale(d.length))
        });

        dataGroup.selectAll('legendDots')
            .data(years)
            .enter()
            .append('circle')
            .attr('cx', (d, i) => margin.left + (width / 2) + (years.length * 65) * (((i + 1) / (years.length)) - 0.5) - 30)
            .attr('cy', 10)
            .attr('r', 7)
            .style('fill', (d, i) => {
                let year = data.find(y => y.year === d.year);
                if (!year.hidden) return cScale(i)
                return `rgb(100,100,100)`
            })
            .on('click', (m, d) => {
                let year = data.find(y => y.year === d.year);
                year.hidden = !year.hidden;

                drawHistogram()
            })

        dataGroup.selectAll('legendLabels')
            .data(years)
            .enter()
            .append('text')
            .attr('x', (d, i) => margin.left + (width / 2) + (years.length * 65) * (((i + 1) / (years.length)) - 0.5) - 20)
            .attr('y', 10)
            .style('fill', (d, i) => cScale(i))
            .text(d => d.year)
            .attr('text-anchor', 'right')
            .style('alignment-baseline', 'middle')
            .on('click', (m, d) => {
                let year = data.find(y => y.year === d.year);
                year.hidden = !year.hidden;

                drawHistogram()
            })
    }

    drawHistogram()
}

const compareTime = (a, b) => {
    let av = (a[0] * 3600) + (a[1] * 60) + a[2]
    let bv = (b[0] * 3600) + (b[1] * 60) + b[2]

    if (av === bv) return 0
    return av < bv ? -1 : 1
}

window.onload = init