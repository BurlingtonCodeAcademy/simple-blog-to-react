const fs = require('fs');
const $path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 5000;
const publicDir = $path.resolve('./public');
const articlesDir = $path.resolve('./articles');

app.use(express.static('public'));

app.get('/articles/:articleId.json', (request, response) => {
  console.log(`Request path: ${request.path}`);
  console.log('Matching: /articles/:articleId.json');
  const filePath = articleFilePath(request.params.articleId);
  response.sendFile(filePath);
});

app.get('/articles/:articleId', (request, response) => {
  console.log(`Request path: ${request.path}`);
  console.log('\tMatching: /articles/:articleId');
  const filePath = articleFilePath(request.params.articleId);
  if (fs.existsSync(filePath)) {
    const htmlFile = $path.join(publicDir, "article.html");
    response.sendFile(htmlFile);
  } else {
    response.status(404)
      .send(`Article ${request.params.articleId} not found`);
  }
});

app.get('/articles', (request, response) => {
  response.sendFile($path.join(publicDir, 'articles.html'));
});

app.get('/articles.json', (request, response) => {
  const articles = allArticles();
  const data = JSON.stringify(articles);
  response.type('application/json').send(data);
});

app.get('/publish', (request, response) => {
  const htmlFile = $path.join(publicDir, "publish.html")
  response.sendFile(htmlFile);
});

app.post('/articles',
  express.urlencoded({extended: false}),
  (request, response) => {
    console.log("In the POST handler for /publish")
    createArticle(nextArticleId(), request.body, response)
})

app.get('/search', (request, response) => {
  response.sendFile($path.join(publicDir, "search.html"))
})

app.get('/search.json', (request, response) => {
  const results = searchArticles(request.query);
  response.type('application/json');
  response.send(JSON.stringify(results));
})

function searchArticles(params) {
  const results = allArticles()
    .filter(article => {
      if (params.author) {
        const articleAuthor = article.author || '';
        const targetAuthor = params.author || '';
        return (
          articleAuthor.toLowerCase().includes(targetAuthor.toLowerCase())
        )
      }
    })
  return results
}

function createArticle(articleId, params, response) {
  const article = {
    id: articleId,
    author: params.author.trim(),
    title: params.title.trim(),
    body: params.body.trim()
  };

  const articleDataFile = $path.join(articlesDir, articleId + ".json")
  console.log("About to write the file ... ")
  fs.writeFile(articleDataFile, JSON.stringify(article), (err) => {
    if (err) {
      console.log("ERROR ... ");
      response.status(500).send(err);
    } else {
      console.log("Redirecting ... ");
      response.redirect('/articles');
    }
  });
}

function nextArticleId() {
  console.log("In the nextArticleId")
  const articles = allArticles();
  // Get the highest article ID from allArticles.
  const highestId = articles[articles.length - 1].id;
  return highestId + 1;
}

function allArticles() {
  console.log("In the allArticles");
    return fs.readdirSync(articlesDir)
      .filter(file => file.endsWith('.json'))
      .map((file) => {
        const data = fs.readFileSync($path.join(articlesDir, file));
        return JSON.parse(data);
      })
      .sort((a, b) => (a.id - b.id))
}

function articleFilePath(articleId) {
  // accept: 1 Argument
  // return: 1.json Value
  return $path.join(articlesDir, articleId + ".json");
}

app.listen(port, () => {
  console.log(`Blog app listening on port ${port}`);
});
