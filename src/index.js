const baseUrl = "https://en.wikipedia.org/w/api.php";

const form = document.getElementById('searchForm')
const randomBtn = document.getElementById('randomBtn')

const mainSection = document.getElementById('results')
mainSection.classList.add("m-5", "container-sm")

const rowResultsTitle = document.createElement('div')
const colResultsTitle = document.createElement('div')

rowResultsTitle.className = "row"
colResultsTitle.className = "col-12"

const rowResultsGallery = document.createElement('div')
rowResultsGallery.classList.add("row", "justify-content-center")

const h3 = document.createElement('h3')                 // title of results section
h3.classList.add("mt-3", "results-title")

let hasFoundArticles = false
let displayRandom = true


getLastFeatured() // get featured articles on startup

form.addEventListener('submit', (e) => {
    e.preventDefault()

    displayRandom = false

    let formData = new FormData(form)
    let searchTerm = formData.get('searchTerm')

    form.reset()

    performSearch(searchTerm)
})

randomBtn.addEventListener('click', getLastFeatured)


async function getLastFeatured() {
    hasFoundArticles = false
    displayRandom = true

    prepareResultsSection()

    const today = new Date(new Date().getTime());
    let currentDay = today

    // expolore last 12 days
    for (let i = 0; i < 12; i++) {
        currentDay.setDate(today.getDate() - 1);

        const year = currentDay.getFullYear()
        const month = (currentDay.getMonth() + 1)
            .toString()
            .padStart(2, '0')
        const day = currentDay.getDate()
            .toString()
            .padStart(2, '0')

        // console.log("day:", day)

        let url = `https://api.wikimedia.org/feed/v1/wikipedia/en/featured/${year}/${month}/${day}`;

        try {
            let response = await fetch(url);
            if (response.ok == false) {
                let error = response.json()
                throw new Error(error.message)
            }

            let data = await response.json()
            // the response can include the daily featured article, featured image or media file, list of most read articles, latest news stories, and events from that day in history. 
            let featuredThisDay = data.mostread.articles

            // limit search to 10 most popular rather than all 40+ featured articles
            let randNo = Math.floor(Math.random() * 10)

            let articleTitle = featuredThisDay[randNo].title.replace(/_/g, " ")
            let articleText = featuredThisDay[randNo]
                .extract
                .slice(0, 170) + "...";                         // truncate text
            let articleUrl = featuredThisDay[randNo].content_urls.desktop.page

            let imgURL
            try {
                imgURL = featuredThisDay[randNo].originalimage.source
                // console.log(data.query.pages[String(pageID)].thumbnail.source)
            } catch (err) {
                imgURL = '../img/default.jpg'
            }
            generateCard(articleTitle, articleText, articleUrl, imgURL)

        } catch (error) {
            alert(error.message)
        }
    }
    mainSection.appendChild(rowResultsGallery)

}

function performSearch(searchTerm) {

    let params = {
        action: "query",
        list: "search",
        srsearch: searchTerm,
        format: "json",
        srlimit: 12
    }; // how many search results

    let url = baseUrl + "?origin=*";        // to resolve cors cross-origin request issues

    Object.keys(params).forEach(function (key) { url += "&" + key + "=" + params[key]; });
    // adds key/value pairs to query like this k=v&k=v&k=v

    fetch(url)
        .then(response => response.json())
        .then(processFoundData)

        .catch(function (error) { console.log(`${error.name}:\n${error.message}`); });
}

async function processFoundData(foundData) {
    let foundArticles = foundData.query.search              // could be undefined
    hasFoundArticles = Boolean(foundArticles.length)

    prepareResultsSection(hasFoundArticles)
    // create section in html where resutls will be displayed depending on if there are any or none
    // then displayRandom will be disabled

    for (let artcl of foundArticles) {                      // if none will not run 
        let articleTitle = artcl.title

        let articleText = artcl.snippet
            .replace(/(<([^>]+)>)/ig, "")                   // strip html tags from snippet
            .slice(0, 170) + "...";                         // truncate text

        let pageID = Number(artcl.pageid)

        let articleUrl = 'https://en.wikipedia.org/?curid=' + pageID

        let imgUrl = await getArticleImage(articleTitle, pageID)

        generateCard(articleTitle, articleText, articleUrl, imgUrl)
    }
    mainSection.appendChild(rowResultsGallery)

}

async function getArticleImage(title, pageID) {
    let url = baseUrl + "?origin=*" + `&action=query&format=json&prop=pageimages&titles=${title}&pithumbsize=260`;        // "?origin=*" to resolve cors cross-origin request issues
    let res = await fetch(url)
    let data = await res.json()

    let imgURL
    try {
        imgURL = data.query.pages[String(pageID)].thumbnail.source
    } catch (err) {
        imgURL = '../img/default.jpg'
    }
    return imgURL
}

function prepareResultsSection(hasFoundArticles) {
    // clear results section
    mainSection.textContent = ''
    rowResultsTitle.innerHTML = ''
    rowResultsGallery.innerHTML = ''
    h3.textContent = ''

    console.log(hasFoundArticles, displayRandom)

    if (!hasFoundArticles && displayRandom) {            //initial state or when user has clicked button
        h3.textContent = "Some popular articles from last 12 days: "
    } else if (hasFoundArticles && !displayRandom) {            //if successful search don's display random
        h3.textContent = "Your search results: "
    } else if (!hasFoundArticles && !displayRandom) {
        h3.textContent = 'No results found.'
    }

    colResultsTitle.appendChild(h3)
    rowResultsTitle.appendChild(colResultsTitle)
    mainSection.appendChild(rowResultsTitle)
}


function generateCard(title, text, url, img) {
    // console.log(title, text, url, img)
    rowResultsGallery.innerHTML += `
        <div class="col-sm-12 col-md-6 col-lg-4" >
            <div class="card m-5 p-2">
                <div class="card-thumbnail">
                    <img src="${img}" class="img-fluid" alt="${title}">
                </div>
                <div class="card-body">
                    <h4 class="card-title fs-4">${title}</h4>
                    <p class="card-text">${text}</p>
                    <a href="${url}" target="blank" class="btn link-btn">Read More</a>
                </div>
            </div>
        </div >
        `
}
