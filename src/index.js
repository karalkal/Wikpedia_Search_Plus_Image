const form = document.getElementById('searchForm')
const submitBtn = document.querySelector('#submitBtn')
const randBtn = document.querySelector('#submitBtn2');
const resultsSection = document.getElementById('results')
const baseUrl = "https://en.wikipedia.org/w/api.php";

let keyword = ""

submitBtn.addEventListener('click', (e) => {
    e.preventDefault()

    let formData = new FormData(form)
    let searchTerm = formData.get('searchTerm')
    keyword = searchTerm;
    // form.reset()

    fetchData(searchTerm)

    randBtn.style.display = "initial"
})

randBtn.addEventListener('click', (e) => {
    e.preventDefault()
    
    form.reset()

    fetchData(keyword, false)
})

async function decodeDataRandom(foundData) {

    prepareResultsSection()     // create section in html where resutls will be displayed

    const foundArticle  = foundData.query.search[Math.floor(Math.random()*foundData.query.search.length)];

        let articleTitle = foundArticle.title

        let articleText = foundArticle.snippet
            .replace(/(<([^>]+)>)/gi, "")               // strip html tags from 
            .slice(0, 130) + "...";                      // truncate text

        let pageID = Number(foundArticle.pageid)

        let articleUrl = 'https://en.wikipedia.org/?curid=' + pageID

        let imgUrl = await getArticleImage(articleTitle, pageID)
        // console.log(imgUrl)

        generateCard(articleTitle, articleText, articleUrl, imgUrl)
    }

function fetchData(searchTerm, flag=true) {

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
        .then(x=> {
            flag === true ? decodeData(x) : decodeDataRandom(x);
        })

        .catch(function (error) { console.log(`${error.name}:\n${error.message}`); });
}


async function decodeData(foundData) {

    prepareResultsSection()     // create section in html where resutls will be displayed

    for (let foundArticle of foundData.query.search) {
        // console.log(foundData)
        let articleTitle = foundArticle.title

        let articleText = foundArticle.snippet
            .replace(/(<([^>]+)>)/gi, "")               // strip html tags from 
            .slice(0, 130) + "...";                      // truncate text

        let pageID = Number(foundArticle.pageid)

        let articleUrl = 'https://en.wikipedia.org/?curid=' + pageID

        let imgUrl = await getArticleImage(articleTitle, pageID)
        // console.log(imgUrl)

        generateCard(articleTitle, articleText, articleUrl, imgUrl)
    }
}

async function getArticleImage(title, pageID) {
    let url = baseUrl + "?origin=*" + `&action=query&format=json&prop=pageimages&titles=${title}&pithumbsize=260`;        // "?origin=*" to resolve cors cross-origin request issues
    let imgURL

    let res = await fetch(url)
    let data = await res.json()
    try {
        imgURL = data.query.pages[String(pageID)].thumbnail.source
        // console.log(data.query.pages[String(pageID)].thumbnail.source)
    } catch (err) {
        imgURL = '../img/default.jpg'
    }

    // console.log(imgURL)
    return imgURL
}

function prepareResultsSection() {
    resultsSection.textContent = ''
    let containerDiv = document.createElement('div')
    let rowDiv = document.createElement('div')
    let colDiv = document.createElement('div')
    let h2 = document.createElement('h2')

    containerDiv.className = "container"
    rowDiv.className = "row"
    rowDiv.id = "found"
    colDiv.className = "col-12"
    h2.classList.add("mb-3", "text-danger")
    h2.textContent = "Your results: "
    colDiv.appendChild(h2)
    rowDiv.appendChild(colDiv)
    containerDiv.appendChild(rowDiv)
    resultsSection.appendChild(containerDiv)
    /*
        resultsSection.innerHTML = `
        <div class="container">
            <div class="row" id="found">
                <div class="col-12">
                    <h2 class="mb-3 text-danger">Your results: </h2>
                </div>
            </div>
        </div>
        `
    */
}


function generateCard(title, text, url, img) {
    let foundDiv = document.getElementById('found')
    // console.log(title, text, url)

    if (!title || !text || !url) {
        foundDiv.textContent = 'No results found'
    } else {
        foundDiv.innerHTML += `
        <div class="col-sm-12 col-md-6 col-lg-4" >
            <div class="card my-3">
                <div class="card-thumbnail">
                    <img src="${img}" class="img-fluid" alt="${title}">
                </div>
                <div class="card-body">
                    <h3 class="card-title fs-4">${title}</h3>
                    <p class="card-text">${text}</p>
                    <a href="${url}" target="blank" class="btn btn-info link-btn">Read More</a>
                </div>
            </div>
        </div >
        `
    }
}


