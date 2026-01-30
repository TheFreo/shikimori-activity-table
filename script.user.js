// ==UserScript==
// @name         Shikimori Activity Table
// @namespace    https://github.com/TheFreo/shikimori-activity-table
// @version      2026-01-31
// @description  Adds an activity table to Shikimori
// @author       TheFreo
// @match        *://shiki.one/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const css = document.createElement('style');
    css.innerText = `   :root {
	--color-scale-1: rgba(22, 27, 34, .41);
	--color-scale-2: rgb(14, 68, 41);
	--color-scale-3: rgb(0, 109, 50);
	--color-scale-4: rgb(38, 166, 65);
	--color-scale-5: rgb(57, 211, 83);
	--square-size: 15px;
	--square-gap: 5px;
	--week-width: calc(var(--square-size) + var(--square-gap));
}

.months {
	display: grid;
	grid-template-columns: calc(var(--week-width) * 3) calc(var(--week-width) * 2.4) calc(var(--week-width) * 3) calc(var(--week-width) * 2.4) calc(var(--week-width) * 2.4) calc(var(--week-width) * 3) calc(var(--week-width) * 2.4) calc(var(--week-width) * 2.9) calc(var(--week-width) * 2.6) calc(var(--week-width) * 2.3) calc(var(--week-width) * 3) calc(var(--week-width) * 1)
}

#contribution-wrapper {
	display: inline-grid;
	grid-template-areas: "empty months"
		"days squares";
	grid-template-columns: auto 1fr;
	grid-gap: 4px 6px;
	font-size: 10px;
}

.months {
	grid-area: months;
}

.days {
	grid-area: days;
	display: grid;
	margin-top: 11px;
	display: none
}

#contribution-grid {
	grid-area: squares;
}

body {
	background-color: rgb(255, 255, 255);
}

#contribution-grid {
	display: grid;
	gap: 2px;
	grid-auto-flow: column;
	grid-template-rows: repeat(7, 11px);
	justify-content: start;
}

.cell {
	background-color: #ebedf0;
	block-size: 10px;
	border-radius: 2px;
	inline-size: 10px;
	border: .5px solid #ffffff0d;
}

.wrapperAll {
	padding: 20px;
	border: 1px #e1e4e8 solid;
	margin: 6px 0;
}

.title {
	font-weight: bold;
}

.wrapperMob {
	overflow-x: auto;
	width: inherit;
} `;
    document.head.appendChild(css);


    // Your code here...


    let lastUrl = location.href;
    new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            setTimeout(() => { startWork() }, 2000)
        }
    }).observe(document, { subtree: true, childList: true })

    function startWork() {
        document.querySelector(".activity").style.display = "none";
        document.querySelector(".c-left").innerHTML += `<div style="display: table-caption; width: -moz-available;"><div class="title">Активность на сайте</div><select id="yearSelect"></select><h2 class="wait" style="text-align: center;">Please Wait</h2><div id="contribution-wrapper" style="display: none">
    <ul class="months">
      <liq>Jan</liq>
      <li>Feb</li>
      <li>Mar</li>
      <li>Apr</li>
      <li>May</li>
      <li>Jun</li>
      <li>Jul</li>
      <li>Aug</li>
      <li>Sep</li>
      <li>Oct</li>
      <li>Nov</li>
      <li>Dec</li>
    </ul>
    <ul class="days">
      <li>Mon</li>
      <li>Wed</li>
      <li>Fri</li>
    </ul>
    <div id="contribution-grid"></div>
  </div>
  </div></div>`;
        parser().then(dailyActivitiesArray => {
            const activityArr = dailyActivitiesArray;
            createActivity(activityArr);
        });
    }

    async function fetchUrl() {
        const userId = document.querySelector(".profile-head").dataset.userId
        //let history = new Array();
        let createdArr = [];
        const seenIds = new Set();
        let page = 0;
        //let delay = Math.round(60000 / 90); // Задержка для соблюдения лимита запросов
        while (true) {
            const response = await fetch(`https://shiki.one/api/users/${userId}/history?limit=100&page=${page}`);
            const json = await response.json();
            if (!response.ok || json.length === 0) break;

            for (const { id, created_at } of json) {
                if (!seenIds.has(id)) {
                    seenIds.add(id);
                    createdArr.push(created_at);
                }
            }

            page++;
        }
        return createdArr;
    }

    async function parser() {
        const activities = await fetchUrl();
        const dailyActivities = {};

        activities.forEach(activity => {
            const dateObj = new Date(activity);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const date = `${year}-${month}-${day}`;

            if (!dailyActivities[date]) {
                dailyActivities[date] = {
                    date: date,
                    count: 0,
                };
            }
            dailyActivities[date].count++;
        });
        return Object.values(dailyActivities);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function createActivity(mainArr) {
        const cssProperties = [
            "--color-scale-1",
            "--color-scale-2",
            "--color-scale-3",
            "--color-scale-4",
            "--color-scale-5"
        ];

        const parseDateAsLocal = (dateString) => {
            const hasTimeOrTimeZone = /\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[\+\-]\d{2}:?\d{2})?$/.test(
                dateString
            );
            return hasTimeOrTimeZone
                ? new Date(dateString)
                : new Date(`${dateString}T00:00:00`);
        };

        const formatDateFull = (date) => {
            if (isNaN(date)) return "";
            const options = {
                day: "numeric",
                month: "long",
                weekday: "long",
                year: "numeric"
            };
            return new Intl.DateTimeFormat("en-US", options).format(date);
        };

        const getCurrentDateFormatted = () => {
            return new Date().toISOString().split("T")[0];
        };


        // Color handling functions
        const getCellColor = (count) => {
            if (count === 0) return `var(${cssProperties[0]})`;
            if (count <= 5) return `var(${cssProperties[1]})`;
            if (count <= 10) return `var(${cssProperties[2]})`;
            if (count <= 15) return `var(${cssProperties[3]})`;
            return `var(${cssProperties[4]})`;
        };

        // Cell creation and gr
        const createCell = (count, dateString, isPrimary) => {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.style.backgroundColor = isPrimary ? getCellColor(count) : "transparent";
            cell.style.border = isPrimary ? 1 : "none";
            cell.title = dateString;
            if (isPrimary) {
                if (
                    new Date(dateString).toISOString().split("T")[0] ===
                    getCurrentDateFormatted()
                ) {
                    cell.classList.add("current");
                }
            }
            cell.textContent = " "
            return cell;
        };

        const getDaysArray = (start, end) => {
            let arr = [];
            let startDate = new Date(start - 1);
            let endDate = new Date(end);

            startDate.setDate(startDate.getDate() - startDate.getDay());
            endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

            while (startDate <= endDate) {
                const isPrimary = startDate >= start && startDate <= end;
                arr.push({ date: new Date(startDate), isPrimary });
                startDate.setDate(startDate.getDate() + 1);
            }
            return arr;
        };

        const currentYear = new Date().getFullYear();
        const generateYearArray = (arr) => {
            let years = [];
            let maxDate = arr[arr.length - 1].date.split('-')[0];
            let year = currentYear + 1;
            while (maxDate < year) {
                year--
                years.push(year)
            }
            return years;
        };

        const yearSelect = document.querySelector("select#yearSelect");
        const grid = document.getElementById("contribution-grid");

        const years = generateYearArray(mainArr);
        years.forEach((year) => {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            if (year === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        });

        // Grid update function
        const updateGrid = (selectedYear) => {
            grid.innerHTML = "";
            const startDate = parseDateAsLocal(`${selectedYear}-01-01`);
            const endDate = parseDateAsLocal(`${selectedYear}-12-31`);
            const dateRange = getDaysArray(startDate, endDate);

            dateRange.forEach(({ date, isPrimary }) => {
                const formattedDate = formatDateFull(date);
                const dateComparisonString = date.toISOString().split("T")[0];
                const contribution = mainArr.find(
                    (c) => new Date(c.date).toISOString().split("T")[0] === dateComparisonString
                );
                const count = contribution && isPrimary ? contribution.count : 0;
                const cell = createCell(count, formattedDate, isPrimary);
                grid.appendChild(cell);
            });
        };

        yearSelect.addEventListener("change", () => {
            updateGrid(yearSelect.value);
        });

        document.querySelector(".wait").style.display = "none";
        document.querySelector("#contribution-wrapper").style.display = "inline-grid";

        //Adaptive
        if (document.querySelector(".c-left").offsetWidth >= 700) {
            document.querySelector("#contribution-wrapper").classList.add('wrapperAll');
            document.querySelector(".days").style.display = "inline-grid";
        }
        if (document.querySelector(".c-left").offsetWidth < 640) {
            document.querySelector("#contribution-wrapper").classList.add('wrapperMob', 'wrapperAll');
            document.querySelector(".days").style.display = "inline-grid";
        }
        updateGrid(currentYear);
    };

    startWork();
})();
