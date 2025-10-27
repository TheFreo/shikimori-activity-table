let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    setTimeout(() => {startWork()}, 2000)
  }
}).observe(document, { subtree: true, childList: true })

function startWork() {
document.querySelector(".activity").style.display = "none";
document.querySelector(".c-left").innerHTML += `<div style="display: table-caption; width: -moz-available;"><div class="title">Активность на сайте</div><select id="yearSelect"></select><div id="contribution-wrapper">
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
    let history = new Array();
    let page = 0;
    //let delay = Math.round(60000 / 90); // Задержка для соблюдения лимита запросов

    while (page < 10000) {
        page += 1;
        //await sleep(delay);
        let response = await fetch(`https://shikimori.one/api/users/${userId}/history?limit=100&page=${page}`);
        let json = await response.json();

        if (response.ok && json.length != 0) {
            //console.log(`Загрузка страницы ${page}`);
            for (let entry of json) {
                let duplicate = history.findLast(e => e.id == entry.id);
                if (!duplicate) {
                    history.push(entry);
                }
            }
        } else {
            break;
        }
    }

    return history;
}

async function parser() {
    const activities = await fetchUrl();
    const dailyActivities = {};

    activities.forEach(activity => {
        const dateObj = new Date(activity.created_at);
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
