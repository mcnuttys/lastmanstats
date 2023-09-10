const resultsURL = (id, key, listname) => {
    return `https://my4.raceresult.com/${id}/RRPublish/data/list?key=${key}&listname=${listname}&page=results&contest=0&r=all&l=0`
}

const lapTimesURL = (id, key, listname) => {
    return `https://my4.raceresult.com/${id}/RRPublish/data/list?key=${key}&listname=${listname}&page=results&contest=0&r=all&l=0`
}

const years = [
    {
        'year': '2023',
        'id': '258096',
        'key': '4e5b2a9bb7ef9b1a606662c6058e4a34',
        'format': '#1_LMS',
        'resultsListName': 'Presenter%2FAnnouncer%7CLive%20Leaderboard',
        'splitsListName': 'Presenter%2FAnnouncer%7CLap%20Splits',
    },
    {
        'year': '2022',
        'id': '179806',
        'key': '0552215f9bcba81bf93e214fe32b6bf0',
        'format': '#1_LMS',
        'resultsListName': 'Presenter%2FAnnouncer%7CLive%20Leaderboard',
        'splitsListName': 'Presenter%2FAnnouncer%7CLap%20Splits',
    },
    {
        'year': '2021',
        'id': '158135',
        'key': '59cc5bcd36d436f73fb3d93cb6538fbd',
        'format': '#1_LMS',
        'resultsListName': 'Presenter%2FAnnouncer%7CLive%20Leaderboard',
        'splitsListName': 'Presenter%2FAnnouncer%7CLap%20Splits',
    },
    {
        'year': '2020',
        'id': '135435',
        'key': '1ce789764f3ec1aaec35093c3b06de03',
        'format': '#1_A Racer',
        'resultsListName': 'Presenter%2FAnnouncer%7CLive%20Leaderboard%20A%20Racers',
        'splitsListName': 'Presenter%2FAnnouncer%7CLap%20Splits%20A%20Racers',
    },
    {
        'year': '2019',
        'id': '106948',
        'key': '77d738f6249548744f49c81e8b74fc48',
        'format': '#1_Last Man Standing Ultramarathon',
        'resultsListName': 'Presenter%2FAnnouncer%7CLive%20Leaderboard',
        'splitsListName': 'Presenter%2FAnnouncer%7CLap%20Splits',
    },
    {
        'year': '2018',
        'id': '82631',
        'key': '61908edb6990b7c186e77b8ab3483a35',
        'format': '#1_Last Man Standing Ultramarathon',
        'resultsListName': 'Presenter%2FAnnouncer%7CLive%20Leaderboard',
        'splitsListName': 'Presenter%2FAnnouncer%7CLap%20Splits',
    },
    {
        'year': '2017',
        'id': '81379',
        'key': '8905172c869b956173cbfa63669a95e9',
        'format': '#1_Last Man Standing Ultramarathon',
        'resultsListName': 'Presenter%2FAnnouncer%7CLive%20Leaderboard',
        'splitsListName': 'Presenter%2FAnnouncer%7CLap%20Splits',
    },
    {
        'year': '2016',
        'id': '133119',
        'key': '0a2b56f2d5cf8fe351479e7312668f5e',
        'format': '#1_Last Man Standing Ultramarathon',
        'resultsListName': 'Presenter%2FAnnouncer%7CLive%20Leaderboard',
        'splitsListName': 'Presenter%2FAnnouncer%7CLap%20Splits',
    }
]

const retrievedRunnerData = []
const getRunnerData = async () => {
    for (let i = 0; i < years.length; i++) {
        let year = years[i]

        await getResults(year)
        await getLapSplits(year)
    }

    return retrievedRunnerData
}

const convertStringToTime = (time, year) => {

    let splitTime = time.split(',')[0].split(':')

    let h, m, s
    if (splitTime.length === 3) {
        [h, m, s] = splitTime.map(t => parseInt(t))
    }

    if (splitTime.length === 2) {
        h = 0
        m = parseInt(splitTime[0])
        s = parseInt(splitTime[1])
    }

    return [h || 0, m || 0, s || 0]
}

const sanitizeName = (name) => {
    return name.replaceAll(',', '').replaceAll('.', '').replaceAll("'", '').toLowerCase()
}

const getResults = async (year) => {
    let resultsUrl = resultsURL(year.id, year.key, year.resultsListName)

    let response = await (await fetch(resultsUrl)).json()

    let data = {}
    if (year.year === '2017') {
        data = response.data[year.format].map(result => {
            return {
                bib: result[0],
                name: result[3],
                indexName: sanitizeName(result[3]),
                lapCount: result[4],
                last: convertStringToTime(result[5], year),
                slowest: convertStringToTime(result[6], year),
                fastest: convertStringToTime(result[7], year),
                average: convertStringToTime(result[8], year),
                totalTime: convertStringToTime(result[9], year),
            }
        })
    } else if (year.year === '2019') {
        data = response.data[year.format].map(result => {
            return {
                bib: result[0],
                name: result[2],
                indexName: sanitizeName(result[2]),
                lapCount: result[5],
                last: convertStringToTime(result[7], year),
                slowest: convertStringToTime(result[8], year),
                fastest: convertStringToTime(result[9], year),
                average: convertStringToTime(result[10], year),
                totalTime: convertStringToTime(result[11], year),
            }
        })
    } else {
        data = response.data[year.format].map(result => {
            return {
                bib: result[0],
                name: result[2],
                indexName: sanitizeName(result[2]),
                lapCount: result[3],
                last: convertStringToTime(result[4], year),
                slowest: convertStringToTime(result[5], year),
                fastest: convertStringToTime(result[6], year),
                average: convertStringToTime(result[7], year),
                totalTime: convertStringToTime(result[8], year),
            }
        })
    }

    data = data.filter(d => d.lapCount != '0')

    data.forEach(raceResult => {
        let runnerData = retrievedRunnerData.find(r => r.indexName === raceResult.indexName)

        if (!runnerData) {
            runnerData = {
                name: raceResult.name,
                indexName: raceResult.indexName,
                raceData: [],
                attempts: 0,
                totalLaps: 0,
                fastest: [],
                slowest: [],
                totalTime: 0,
                lapRecord: [0, 0],
            }

            retrievedRunnerData.push(runnerData)
        }

        runnerData.attempts++;
        runnerData.totalLaps += parseInt(raceResult.lapCount)

        if (raceResult.lapCount > runnerData.lapRecord[0]) {
            runnerData.lapRecord[0] = parseInt(raceResult.lapCount)
            runnerData.lapRecord[1] = year.year
        }

        if (compareTime(runnerData.fastest, raceResult.fastest) > 0)
            runnerData.fastest = [...raceResult.fastest, year.year]

        if (compareTime(raceResult.slowest, runnerData.slowest) > 0)
            runnerData.slowest = [...raceResult.slowest, year.year]

        runnerData.totalTime += raceResult.totalTime[0] + raceResult.totalTime[1] / 60 + raceResult.totalTime[2] / 3600

        runnerData.raceData.push({
            year: year.year,
            bib: raceResult.bib,
            lapCount: raceResult.lapCount,
            last: raceResult.last,
            slowest: raceResult.slowest,
            fastest: raceResult.fastest,
            average: raceResult.average,
            totalTime: raceResult.totalTime,
        })
    });
}

const getLapSplits = async (year) => {
    let lapsUrl = lapTimesURL(year.id, year.key, year.splitsListName)

    let response = await (await fetch(lapsUrl)).json()
    let data = {}

    if (year.year === '2017') {
        data = response.data[year.format].map(d => {
            return {
                bib: d[0],
                name: d[2],
                indexName: sanitizeName(d[2]),
                lapCount: d[5],
                lapTimes: d.slice(6, 6 + Math.min(parseInt(d[5]), 32)).filter(t => t != '').map(split => convertStringToTime(split)),
            }
        }).filter(r => r.lapCount != '0')
    } else if (year.year === '2019') {
        data = response.data[year.format].map(d => {
            return {
                bib: d[0],
                name: d[2],
                indexName: sanitizeName(d[2]),
                lapCount: d[3],
                lapTimes: d.slice(4, 4 + Math.min(parseInt(d[3]), 32)).filter(t => t != '').map(split => convertStringToTime(split)),
            }
        }).filter(r => r.lapCount != '0')
    } else {
        data = response.data[year.format].map(d => {
            return {
                bib: d[0],
                name: d[2],
                indexName: sanitizeName(d[2]),
                lapCount: d[3],
                lapTimes: d.slice(4, 4 + Math.min(parseInt(d[3]), 32)).filter(t => t != '').map(split => convertStringToTime(split)),
            }
        }).filter(r => r.lapCount != '0')
    }

    data.forEach(runner => {
        let runningData = retrievedRunnerData.find(r => r.indexName === runner.indexName)

        if (!runningData) {
            console.dir(retrievedRunnerData)
            console.dir(runner)
            console.dir(runningData)
        }

        let raceData = runningData.raceData.find(y => y.year === year.year)
        raceData.splits = runner.lapTimes
    })
}